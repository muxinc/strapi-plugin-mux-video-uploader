import type { UID } from '@strapi/strapi';
import type { Context } from 'koa';
import { contentTypes, errors, isOperator, traverse } from '@strapi/utils';

import { ASSET_MODEL } from './types';

type Query = Record<string, unknown>;

/** What the mux-asset handlers pass on to the document service: never `ctx.query` itself. */
export interface MuxAssetQuery {
  filters?: unknown;
  sort?: unknown;
  fields?: unknown;
  populate?: unknown;
  _q?: unknown;
}

/** Most items one request returns when the app doesn't set `api.rest.maxLimit`. */
const DEFAULT_MAX_LIMIT = 100;

const LOGICAL_OPERATORS = ['$and', '$or', '$not'];
const SORT_ORDERS = ['asc', 'desc'];
const PAGINATION_KEYS = ['start', 'limit', 'page', 'pageSize'] as const;

const isPlainObject = (value: unknown): value is Query =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getSchema = () => strapi.getModel(ASSET_MODEL);

/** Strapi tags each route with the router it was registered on, so the caller can't pick it. */
const isAdminRoute = (ctx: Context) => ctx.state?.route?.info?.type === 'admin';

/** Like Strapi's core controllers, which fall back to `{}`. */
const getAuth = (ctx: Context) => ctx.state?.auth ?? {};

/**
 * A 400 in Strapi's error format. The `status` keeps it a 400 if this plugin loads another copy of
 * `@strapi/utils` than Strapi does, whose error middleware then doesn't recognize the class.
 */
const badRequest = (message: string, details: Record<string, unknown>) =>
  Object.assign(new errors.ValidationError(message, details), { status: 400, expose: true });

const invalidKey = (key: string, param: string) => badRequest(`Invalid key ${key}`, { key, source: 'query', param });

/** `createdBy`, `updatedBy` and any other link to an admin user. */
const isAdminRelation = (attribute: unknown) => {
  const { type, target } = (attribute ?? {}) as { type?: string; target?: unknown };
  return type === 'relation' && typeof target === 'string' && target.startsWith('admin::');
};

const rejectAdminRelations =
  (param: string) =>
  ({ key, attribute }: { key: string; attribute?: unknown }) => {
    if (isAdminRelation(attribute)) throw invalidKey(key, param);
  };

const dropAdminRelations = (
  { key, attribute }: { key: string; attribute?: unknown },
  { remove }: { remove: (key: string) => void }
) => {
  if (isAdminRelation(attribute)) remove(key);
};

/** Runs a query traversal only when the request set that key. */
const traverseIfSet = <T>(value: T | undefined, traversal: (value: T) => Promise<unknown>) =>
  value === undefined ? undefined : traversal(value);

/**
 * Content API. Mirrors `@strapi/core`'s collection-type controller: validate (400 on private, password
 * or unknown keys) then sanitize, with the caller's permissions. Strapi already treats
 * `createdBy`/`updatedBy` as private; the traversals at the end keep admin users out even if an app
 * sets `populateCreatorFields` on this content type.
 */
const contentApiQuery = async (ctx: Context): Promise<MuxAssetQuery> => {
  const schema = getSchema();
  const auth = getAuth(ctx);

  await strapi.contentAPI.validate.query(ctx.query, schema, { auth });
  const { filters, sort, fields, populate, _q } = await strapi.contentAPI.sanitize.query(ctx.query, schema, {
    auth,
  });

  const options = { schema, getModel: (uid: string) => strapi.getModel(uid as UID.Schema) };

  return {
    filters: await traverseIfSet(filters, (value) =>
      traverse.traverseQueryFilters(rejectAdminRelations('filters'), options, value)
    ),
    sort: await traverseIfSet(sort, (value) =>
      traverse.traverseQuerySort(rejectAdminRelations('sort'), options, value)
    ),
    fields,
    populate: await traverseIfSet(populate, (value) =>
      traverse.traverseQueryPopulate(dropAdminRelations, options, value)
    ),
    _q,
  };
};

/** The model's own scalar attributes (no relations, passwords or private fields), plus its ids. */
const getAdminFields = () =>
  new Set([
    'id',
    'documentId',
    ...Object.entries(getSchema().attributes as Record<string, { type: string; private?: boolean }>)
      .filter(
        ([, attribute]) =>
          contentTypes.isScalarAttribute(attribute) && attribute.type !== 'password' && attribute.private !== true
      )
      .map(([name]) => name),
  ]);

/** Under an attribute only operators may follow, so a filter can't walk into a relation. */
const assertOperatorsOnly = (value: unknown, path: string): void => {
  if (Array.isArray(value)) {
    value.forEach((item) => assertOperatorsOnly(item, path));
    return;
  }

  if (!isPlainObject(value)) return;

  for (const [operator, operand] of Object.entries(value)) {
    if (!isOperator(operator)) throw invalidKey(`${path}.${operator}`, 'filters');
    assertOperatorsOnly(operand, `${path}.${operator}`);
  }
};

const assertAdminFilters = (filters: unknown, allowed: Set<string>): void => {
  if (Array.isArray(filters)) {
    filters.forEach((filter) => assertAdminFilters(filter, allowed));
    return;
  }

  if (!isPlainObject(filters)) throw badRequest('Invalid filters', { source: 'query', param: 'filters' });

  for (const [key, value] of Object.entries(filters)) {
    if (LOGICAL_OPERATORS.includes(key)) assertAdminFilters(value, allowed);
    else if (allowed.has(key)) assertOperatorsOnly(value, key);
    else throw invalidKey(key, 'filters');
  }
};

const isSortOrder = (order: unknown) => typeof order === 'string' && SORT_ORDERS.includes(order.toLowerCase());

const assertAdminSort = (sort: unknown, allowed: Set<string>): void => {
  if (Array.isArray(sort)) {
    sort.forEach((item) => assertAdminSort(item, allowed));
    return;
  }

  if (typeof sort === 'string') {
    for (const part of sort.split(',')) {
      const [field, order = 'asc', ...rest] = part.split(':');
      if (!allowed.has(field) || !isSortOrder(order) || rest.length > 0) throw invalidKey(part, 'sort');
    }
    return;
  }

  if (isPlainObject(sort)) {
    for (const [field, order] of Object.entries(sort)) {
      if (!allowed.has(field) || !isSortOrder(order)) throw invalidKey(field, 'sort');
    }
    return;
  }

  throw badRequest('Invalid sort', { source: 'query', param: 'sort' });
};

const assertAdminFields = (fields: unknown, allowed: Set<string>) => {
  const list = typeof fields === 'string' ? fields.split(',') : fields;
  if (!Array.isArray(list)) throw badRequest('Invalid fields', { source: 'query', param: 'fields' });

  for (const field of list) {
    if (typeof field !== 'string' || !allowed.has(field.trim())) throw invalidKey(String(field), 'fields');
  }
};

/**
 * Admin API, which only serves the plugin's admin page. An explicit allowlist: no `populate`, and
 * `filters`, `sort` and `fields` only on the model's own scalar attributes. Anything else in the query
 * (`order`, `_q`, ...) is dropped, as `order` always was.
 */
const adminQuery = (query: Query): MuxAssetQuery => {
  const { filters, sort, fields, populate } = query;
  if (populate != null) throw invalidKey('populate', 'populate');

  const allowed = getAdminFields();
  if (filters != null) assertAdminFilters(filters, allowed);
  // An empty sort gets the default, as before.
  if (sort) assertAdminSort(sort, allowed);
  if (fields != null) assertAdminFields(fields, allowed);

  return { filters: filters ?? undefined, sort: sort || undefined, fields: fields ?? undefined };
};

/** The request's query with only the keys the caller may use, checked for the API it came through. */
export const getMuxAssetQuery = async (ctx: Context): Promise<MuxAssetQuery> =>
  isAdminRoute(ctx) ? adminQuery(ctx.query) : contentApiQuery(ctx);

/** Strips private and password fields and relations the caller can't read, on the content API only. */
export const sanitizeMuxAssetOutput = async <T>(ctx: Context, data: T): Promise<T> => {
  if (!data || isAdminRoute(ctx)) return data;

  return (await strapi.contentAPI.sanitize.output(data, getSchema(), { auth: getAuth(ctx) })) as T;
};

/** `api.rest.maxLimit` when the app sets one, as Strapi's own content API does; 100 otherwise. */
const getMaxLimit = () => {
  const configured = Number(strapi.config.get('api.rest.maxLimit'));
  return Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_MAX_LIMIT;
};

const INTEGER = /^-?\d+$/;

const toInteger = (value: unknown, name: string): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;

  const number = typeof value === 'string' && INTEGER.test(value) ? Number(value) : value;
  if (typeof number !== 'number' || !Number.isSafeInteger(number)) {
    throw badRequest(`Invalid '${name}' parameter: expected an integer`, { source: 'query', param: name });
  }

  return number;
};

/**
 * `start`/`limit` (what the admin page sends) or `page`/`pageSize`, top level or under `pagination`.
 * Without them, the first `maxLimit` items. Like Strapi, a `limit`/`pageSize` of -1 or above the
 * maximum gets the maximum, and one below 1 gets 1.
 */
export const getPagination = (query: Query): { start: number; limit: number } => {
  const nested = isPlainObject(query.pagination) ? query.pagination : {};
  const args: Partial<Record<(typeof PAGINATION_KEYS)[number], number>> = {};

  for (const key of PAGINATION_KEYS) {
    const value = toInteger(query[key] ?? nested[key], key);
    if (value !== undefined) args[key] = value;
  }

  const usesPages = args.page !== undefined || args.pageSize !== undefined;
  const usesOffset = args.start !== undefined || args.limit !== undefined;
  if (usesPages && usesOffset) {
    throw badRequest('Cannot use both page & offset pagination in the same query', {
      source: 'query',
      param: 'pagination',
    });
  }

  const maxLimit = getMaxLimit();
  const toLimit = (value?: number) =>
    value === undefined || value === -1 || value > maxLimit ? maxLimit : Math.max(value, 1);

  if (usesPages) {
    const limit = toLimit(args.pageSize);
    return { start: (Math.max(args.page ?? 1, 1) - 1) * limit, limit };
  }

  return { start: Math.max(args.start ?? 0, 0), limit: toLimit(args.limit) };
};
