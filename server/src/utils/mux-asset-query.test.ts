import { sanitize, validate } from '@strapi/utils';
import type { Context } from 'koa';
import { beforeEach, describe, expect, it } from 'vitest';

import muxAsset from '../content-types/mux-asset';
import { getMuxAssetQuery, getPagination, sanitizeMuxAssetOutput } from './mux-asset-query';
import { ASSET_MODEL } from './types';

// The query and output checks run on Strapi's real validators and sanitizers, so these tests follow
// the content API rules of the installed `@strapi/utils`, not a copy of them.

/** What `addCreatorFields` in `@strapi/core` adds to every content type. */
const creatorField = (populateCreatorFields: boolean) => ({
  type: 'relation',
  relation: 'oneToOne',
  target: 'admin::user',
  configurable: false,
  writable: false,
  visible: false,
  useJoinTable: false,
  private: !populateCreatorFields,
});

/** The mux-asset model as Strapi builds it from the plugin's content type. */
const assetModel = ({ populateCreatorFields = false } = {}) => ({
  ...muxAsset,
  uid: ASSET_MODEL,
  modelType: 'contentType',
  options: { ...muxAsset.options, populateCreatorFields },
  attributes: {
    ...muxAsset.attributes,
    createdAt: { type: 'datetime' },
    updatedAt: { type: 'datetime' },
    publishedAt: { type: 'datetime', configurable: false, writable: true, visible: false },
    createdBy: creatorField(populateCreatorFields),
    updatedBy: creatorField(populateCreatorFields),
  },
});

/** The admin user fields the unsanitized endpoints exposed. */
const adminUserModel = {
  uid: 'admin::user',
  modelType: 'contentType',
  kind: 'collectionType',
  info: { singularName: 'user', pluralName: 'users', displayName: 'User' },
  options: {},
  attributes: {
    firstname: { type: 'string' },
    email: { type: 'email' },
    password: { type: 'password', private: true },
    resetPasswordToken: { type: 'string', private: true },
    registrationToken: { type: 'string', private: true },
  },
};

const ADMIN_USER = {
  id: 1,
  firstname: 'Ada',
  email: 'admin@example.com',
  password: '$2a$10$hash',
  resetPasswordToken: 'reset-token',
  registrationToken: 'registration-token',
};

/** The Public role as the README sets it up: it can read videos and nothing else. */
const PUBLIC_SCOPES = [`${ASSET_MODEL}.find`, `${ASSET_MODEL}.findOne`, `${ASSET_MODEL}.count`];

const installStrapi = ({
  maxLimit,
  populateCreatorFields,
}: { maxLimit?: number; populateCreatorFields?: boolean } = {}) => {
  const models: Record<string, unknown> = {
    [ASSET_MODEL]: assetModel({ populateCreatorFields }),
    'admin::user': adminUserModel,
  };
  const getModel = (uid: string) => models[uid] as any;

  (globalThis as any).strapi = {
    getModel,
    config: { get: (key: string, fallback?: unknown) => (key === 'api.rest.maxLimit' ? maxLimit : fallback) },
    auth: {
      verify: async (_auth: unknown, { scope }: { scope: string }) => {
        if (!PUBLIC_SCOPES.includes(scope)) throw new Error('Forbidden');
      },
    },
    contentAPI: {
      validate: validate.createAPIValidators({ getModel }),
      sanitize: sanitize.createAPISanitizers({ getModel }),
    },
  };
};

const contentApiContext = (query: Record<string, unknown>) =>
  ({ query, state: { route: { info: { type: 'content-api' } }, auth: { credentials: null } } }) as unknown as Context;

const adminContext = (query: Record<string, unknown>) =>
  ({ query, state: { route: { info: { type: 'admin' } } } }) as unknown as Context;

const populatedKeys = (populate: unknown) =>
  typeof populate === 'object' && populate !== null ? Object.keys(populate) : [];

beforeEach(() => installStrapi());

describe('Content API query', () => {
  it.each([
    ['populating createdBy', { populate: { createdBy: '*' } }],
    ['populating updatedBy', { populate: { updatedBy: '*' } }],
    ['filtering on the admin password', { filters: { updatedBy: { password: { $startsWith: '$2' } } } }],
    ['filtering on the admin reset token', { filters: { createdBy: { resetPasswordToken: { $eq: 'x' } } } }],
    ['filtering on the admin email', { filters: { updatedBy: { email: { $containsi: '@' } } } }],
    ['sorting by an admin field', { sort: 'updatedBy.email:asc' }],
  ])('refuses %s with a ValidationError', async (_, query) => {
    await expect(getMuxAssetQuery(contentApiContext(query))).rejects.toMatchObject({ name: 'ValidationError' });
  });

  it('expands populate=* to the relations the caller may read, which leaves out the admin users', async () => {
    const { populate } = await getMuxAssetQuery(contentApiContext({ populate: '*' }));

    // A video's only relations are createdBy and updatedBy, so nothing is left to populate.
    expect(populate).toEqual({});
  });

  it('keeps admin users out even when the app sets populateCreatorFields', async () => {
    installStrapi({ populateCreatorFields: true });

    const { populate } = await getMuxAssetQuery(contentApiContext({ populate: { createdBy: '*', updatedBy: '*' } }));
    expect(populatedKeys(populate)).toEqual([]);

    await expect(
      getMuxAssetQuery(contentApiContext({ filters: { updatedBy: { email: { $eq: 'admin@example.com' } } } }))
    ).rejects.toMatchObject({ name: 'ValidationError', status: 400 });
  });

  it('passes a legitimate query through', async () => {
    const query = await getMuxAssetQuery(
      contentApiContext({ filters: { title: { $containsi: 'demo' } }, sort: 'title:asc', fields: ['title'] })
    );

    expect(query).toMatchObject({ filters: { title: { $containsi: 'demo' } }, sort: 'title:asc', fields: ['title'] });
  });
});

describe('Content API output', () => {
  it('drops the admin users behind createdBy and updatedBy', async () => {
    const asset = { id: 1, title: 'A video', createdBy: ADMIN_USER, updatedBy: ADMIN_USER };

    const output = await sanitizeMuxAssetOutput(contentApiContext({}), [asset]);

    expect(output).toEqual([{ id: 1, title: 'A video' }]);
  });

  it('leaves admin API responses as they are', async () => {
    const asset = { id: 1, title: 'A video' };

    expect(await sanitizeMuxAssetOutput(adminContext({}), asset)).toBe(asset);
  });
});

describe('Admin API query', () => {
  it('accepts what the plugin admin page sends', async () => {
    const query = await getMuxAssetQuery(
      adminContext({
        start: '0',
        limit: '10',
        sort: 'createdAt',
        order: 'desc',
        filters: { $or: [{ title: { $containsi: 'demo' } }, { asset_id: { $containsi: 'demo' } }] },
      })
    );

    expect(query).toEqual({
      filters: { $or: [{ title: { $containsi: 'demo' } }, { asset_id: { $containsi: 'demo' } }] },
      sort: 'createdAt',
      fields: undefined,
    });
  });

  it.each([
    ['populate', { populate: '*' }],
    ['a filter on an admin relation', { filters: { updatedBy: { email: { $eq: 'x' } } } }],
    ['a relation under an attribute', { filters: { title: { updatedBy: 'x' } } }],
    ['a sort on an admin relation', { sort: 'updatedBy' }],
    ['an unknown sort order', { sort: 'title:sideways' }],
    ['a field outside the model', { fields: ['createdBy'] }],
  ])('refuses %s with a 400', async (_, query) => {
    await expect(getMuxAssetQuery(adminContext(query))).rejects.toMatchObject({ name: 'ValidationError', status: 400 });
  });
});

describe('Pagination', () => {
  it.each([
    ['nothing', {}, { start: 0, limit: 100 }],
    ['start and limit', { start: '20', limit: '10' }, { start: 20, limit: 10 }],
    ['page and pageSize under pagination', { pagination: { page: '3', pageSize: '10' } }, { start: 20, limit: 10 }],
    ['a limit above the maximum', { limit: '100000' }, { start: 0, limit: 100 }],
    ['a pageSize above the maximum', { pagination: { pageSize: '100000' } }, { start: 0, limit: 100 }],
    ['a limit of -1', { limit: '-1' }, { start: 0, limit: 100 }],
    ['a limit below 1', { limit: '0' }, { start: 0, limit: 1 }],
  ])('turns %s into a bounded window', (_, query, expected) => {
    expect(getPagination(query)).toEqual(expected);
  });

  it('caps at api.rest.maxLimit when the app sets it', () => {
    installStrapi({ maxLimit: 25 });

    expect(getPagination({ limit: '1000' })).toEqual({ start: 0, limit: 25 });
  });

  it.each([
    ['a limit that is not an integer', { limit: 'abc' }],
    ['offset and page pagination together', { start: '0', page: '1' }],
  ])('refuses %s with a 400', (_, query) => {
    expect(() => getPagination(query)).toThrow(expect.objectContaining({ name: 'ValidationError', status: 400 }));
  });
});
