import { beforeEach, describe, expect, it } from 'vitest';

import { seedAsset } from '../../../test/fixtures';
import { createContext } from '../../../test/koa';
import { FakeStrapi, installFakeStrapi } from '../../../test/strapi';
import { ASSET_MODEL } from '../utils/types';
import muxAssetController from './mux-asset';

let fake: FakeStrapi;
let assetRowId: number;

beforeEach(() => {
  fake = installFakeStrapi();
  ({ id: assetRowId } = seedAsset(fake.db, { description: 'From Mux', tags: ['video'] }));
});

const update = async (body: unknown) => {
  const ctx = createContext({ params: { documentId: assetRowId }, body });
  const result = await muxAssetController.update(ctx as any);
  return { ctx, result, stored: fake.db.rows(ASSET_MODEL)[0] };
};

describe('Update a video', () => {
  it('stores the description and tags, trimming each tag', async () => {
    const { result, stored } = await update({ description: 'A walkthrough', tags: [' mux ', 'video'] });

    expect(result).toEqual({ ok: true });
    expect(stored).toMatchObject({ title: 'A video', description: 'A walkthrough', tags: ['mux', 'video'] });
  });

  it('clears the description when it is null or blank, and the tags with an empty list', async () => {
    expect((await update({ description: null })).stored.description).toBeNull();

    const { stored } = await update({ description: '  ', tags: [] });
    expect(stored).toMatchObject({ description: null, tags: [] });
  });

  it('leaves the description and tags alone when the request has none', async () => {
    const { stored } = await update({ title: 'New title' });

    expect(stored).toMatchObject({ title: 'New title', description: 'From Mux', tags: ['video'] });
  });

  it('keeps the title when it is empty, as before', async () => {
    const { stored } = await update({ title: '', description: 'Only this' });

    expect(stored).toMatchObject({ title: 'A video', description: 'Only this' });
  });

  it.each([
    ['a description that is not a string', { description: 42 }],
    ['tags that are not a list', { tags: 'video, mux' }],
    ['a tag that is not a string', { tags: ['video', 1] }],
    ['an empty tag', { tags: ['video', '  '] }],
  ])('refuses %s and stores nothing', async (_, body) => {
    const { ctx, stored } = await update({ title: 'Changed', ...body });

    expect(ctx.status).toBe(400);
    expect(stored).toMatchObject({ title: 'A video', description: 'From Mux', tags: ['video'] });
    expect(fake.db.query(ASSET_MODEL).update).not.toHaveBeenCalled();
  });
});
