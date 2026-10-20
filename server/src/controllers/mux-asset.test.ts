import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { jobRow, seedAsset } from '../../../test/fixtures';
import { createContext } from '../../../test/koa';
import { FakeStrapi, installFakeStrapi } from '../../../test/strapi';
import { ASSET_MODEL, ROBOT_JOB_MODEL } from '../utils/types';
import { refreshesSettled } from '../webhooks/refresh-queue';
import muxAssetController from './mux-asset';

let fake: FakeStrapi;
let assetRowId: number;
let getAssetById: ReturnType<typeof vi.fn>;

beforeEach(() => {
  getAssetById = vi.fn(async (id: string) => ({ id, status: 'ready', playback_ids: [{ id: 'play_mux' }] }));
  fake = installFakeStrapi({ services: { mux: () => ({ getAssetById }) } });
  ({ id: assetRowId } = seedAsset(fake.db, { description: 'From Mux', tags: ['video'] }));
});

afterEach(() => refreshesSettled());

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

  it('stores the title trimmed', async () => {
    expect((await update({ title: '  New title  ' })).stored.title).toBe('New title');
    expect((await update({ title: 'abc' })).stored.title).toBe('abc');
    expect((await update({ title: 'x'.repeat(255) })).stored.title).toHaveLength(255);
  });

  it('trims tags, drops blanks, splits on commas and drops repeats that differ only in case', async () => {
    const { ctx, stored } = await update({ tags: [' a ', 'A', 'a', 'b,c', '  ', '', 'C', 'Mux'] });

    expect(ctx.status).not.toBe(400);
    expect(stored.tags).toEqual(['a', 'b', 'c', 'Mux']);
  });

  it.each([
    ['a description that is not a string', { description: 42 }],
    ['tags that are not a list', { tags: 'video, mux' }],
    ['a tag that is not a string', { tags: ['video', 1] }],
    ['a title shorter than 3 characters', { title: 'ab' }],
    ['a blank title', { title: '   ' }],
    ['a title that is only 2 characters once trimmed', { title: '  ab  ' }],
    ['a title longer than 255 characters', { title: 'x'.repeat(256) }],
    ['a title that is not a string', { title: 42 }],
  ])('refuses %s with a 400 ValidationError and stores nothing', async (_, body) => {
    const { ctx, stored } = await update({ title: 'Changed', ...body });

    expect(ctx.status).toBe(400);
    expect(ctx.body.error.message).toBe('ValidationError');
    expect(stored).toMatchObject({ title: 'A video', description: 'From Mux', tags: ['video'] });
    expect(fake.db.query(ASSET_MODEL).update).not.toHaveBeenCalled();
  });
});

describe('Create a video', () => {
  const create = async (body: Record<string, unknown>) => {
    const ctx = createContext({ body: { body } });
    const result = await muxAssetController.create(ctx as any);
    return { ctx, result };
  };

  const created = () => fake.db.rows(ASSET_MODEL).find((row) => row.id !== assetRowId);

  it('stores only which Mux upload or asset it is, its title and its playback policy', async () => {
    const { result } = await create({
      title: ' Imported ',
      upload_id: 'upl_9',
      asset_id: 'ast_9',
      signed: true,
      playback_id: 'play_someone_elses',
      isReady: true,
      asset_data: { id: 'ast_9', status: 'ready' },
      description: 'Typed without Update',
      tags: ['nope'],
      error_message: 'nope',
      robots_outputs: { summarize: { job_id: 'rjob_fake', title: 'Fake' } },
      duration: 1,
    });

    expect(result).toMatchObject({ title: 'Imported', upload_id: 'upl_9', asset_id: 'ast_9', signed: true });
    expect(Object.keys(fake.db.query(ASSET_MODEL).create.mock.calls[0][0].data).sort()).toEqual([
      'asset_id',
      'signed',
      'title',
      'upload_id',
    ]);
  });

  it.each([
    ['no title', {}],
    ['a title shorter than 3 characters', { title: 'ab' }],
    ['a blank title', { title: '    ' }],
    ['an asset id that is not a string', { title: 'A video', asset_id: { $ne: null } }],
  ])('refuses %s with a 400 and stores nothing', async (_, body) => {
    const { ctx } = await create(body);

    expect(ctx.status).toBe(400);
    expect(fake.db.query(ASSET_MODEL).create).not.toHaveBeenCalled();
  });

  it('reads the rest of the asset from Mux', async () => {
    await create({ title: 'Imported', asset_id: 'ast_9' });
    await refreshesSettled();

    expect(getAssetById).toHaveBeenCalledWith('ast_9');
    expect(created()).toMatchObject({ asset_id: 'ast_9', playback_id: 'play_mux', isReady: true });
  });

  it('answers with the row after the stored results are written, with summary tags de-duplicated', async () => {
    fake.db.seed(ROBOT_JOB_MODEL, [
      jobRow({
        asset_id: 'ast_9',
        status: 'completed',
        detail_loaded: true,
        parameters: { asset_id: 'ast_9' },
        outputs: { description: 'Described', tags: ['Mux', 'mux', ' video '] },
      }),
    ]);

    const { result } = await create({ title: 'Imported', asset_id: 'ast_9' });

    expect(result).toMatchObject({ description: 'Described', tags: ['Mux', 'video'] });
  });

  it('writes the Robots results stored before the asset reached Strapi', async () => {
    fake.db.seed(ROBOT_JOB_MODEL, [
      jobRow({
        asset_id: 'ast_9',
        status: 'completed',
        detail_loaded: true,
        mux_updated_at: '2026-10-01T00:00:00.000Z',
        parameters: { asset_id: 'ast_9' },
        outputs: { title: 'Summary', description: 'Described', tags: ['a'] },
      }),
    ]);

    await create({ title: 'Imported', asset_id: 'ast_9' });

    expect(created()).toMatchObject({
      description: 'Described',
      tags: ['a'],
      robots_outputs: { summarize: { job_id: 'rjob_1', title: 'Summary' } },
    });
  });
});
