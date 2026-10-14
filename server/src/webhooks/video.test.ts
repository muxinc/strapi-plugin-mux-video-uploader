import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { webhookContext } from '../../../test/koa';
import { FakeStrapi, installFakeStrapi } from '../../../test/strapi';
import mux from '../controllers/mux';
import muxService from '../services/mux';
import { ASSET_MODEL } from '../utils/types';
import { refreshesSettled } from './refresh-queue';

const readyAsset = {
  id: 'ast_1',
  status: 'ready',
  playback_ids: [{ id: 'play_1', policy: 'public' }],
  duration: 12.5,
  aspect_ratio: '16:9',
  tracks: [{ id: 'trk_video', type: 'video' }],
};

let fake: FakeStrapi;
let getAssetById: ReturnType<typeof vi.fn>;

beforeEach(() => {
  getAssetById = vi.fn();
  fake = installFakeStrapi({ services: { mux: () => ({ ...muxService(), getAssetById }) } });
});

// A refresh scheduled by one test must not run against the next test's Strapi.
afterEach(() => refreshesSettled());

/** Delivers a signed event to the webhook route, as Mux would. */
async function deliver(type: string, data: Record<string, unknown>) {
  const ctx = webhookContext({ type, data, id: 'evt_1', object: { type: 'asset', id: data.id } });
  await mux.muxWebhookHandler(ctx as any);
  return ctx;
}

const seedAsset = (data: Record<string, unknown>) =>
  fake.db.seed(ASSET_MODEL, [{ title: 'A video', signed: false, isReady: false, ...data }])[0];

const storedAsset = (id: number) => fake.db.rows(ASSET_MODEL).find((row) => row.id === id);

describe('video events: what each one writes', () => {
  it('video.upload.asset_created stores the asset id on the upload it came from', async () => {
    const { id } = seedAsset({ upload_id: 'upl_1', asset_id: null });

    const ctx = await deliver('video.upload.asset_created', { id: 'upl_1', asset_id: 'ast_1' });

    expect(ctx.status).toBe(200);
    expect(storedAsset(id)).toMatchObject({ upload_id: 'upl_1', asset_id: 'ast_1' });
  });

  it('video.asset.ready stores the playback id, duration, aspect ratio and the whole asset', async () => {
    const { id } = seedAsset({ asset_id: 'ast_1' });

    await deliver('video.asset.ready', readyAsset);

    expect(storedAsset(id)).toMatchObject({
      playback_id: 'play_1',
      duration: 12.5,
      aspect_ratio: '16:9',
      isReady: true,
      asset_data: readyAsset,
    });
  });

  it('video.upload.errored stores a generic error on the upload', async () => {
    const { id } = seedAsset({ upload_id: 'upl_1', asset_id: null });

    await deliver('video.upload.errored', { id: 'upl_1' });

    expect(storedAsset(id)).toMatchObject({ error_message: 'There was an unexpected error during upload' });
  });

  it("video.asset.errored stores Mux's error type and first message", async () => {
    const { id } = seedAsset({ asset_id: 'ast_1' });

    await deliver('video.asset.errored', {
      id: 'ast_1',
      status: 'errored',
      errors: { type: 'invalid_input', messages: ['The file could not be read', 'second'] },
    });

    expect(storedAsset(id)).toMatchObject({ error_message: 'invalid_input: The file could not be read' });
  });

  it("cuts Mux's error message to the 255 characters the column holds", async () => {
    const { id } = seedAsset({ asset_id: 'ast_1' });

    await deliver('video.asset.errored', {
      id: 'ast_1',
      errors: { type: 'invalid_input', messages: ['x'.repeat(400)] },
    });

    expect(storedAsset(id)?.error_message).toHaveLength(255);
  });

  it('only writes to the asset the event names', async () => {
    const other = seedAsset({ asset_id: 'ast_other', title: 'Another video' });
    seedAsset({ asset_id: 'ast_1' });

    await deliver('video.asset.ready', readyAsset);

    expect(storedAsset(other.id)).toMatchObject({ asset_id: 'ast_other', isReady: false });
    expect(storedAsset(other.id)?.playback_id).toBeUndefined();
  });
});

describe('video events: snapshots', () => {
  it('video.asset.ready on an asset without playback IDs stores a null playback id instead of failing', async () => {
    const { id } = seedAsset({ asset_id: 'ast_1' });

    const ctx = await deliver('video.asset.ready', { ...readyAsset, playback_ids: undefined });

    expect(ctx.status).toBe(200);
    expect(storedAsset(id)).toMatchObject({ playback_id: null, isReady: true });
  });

  it("marks the asset ready only when Mux says it's ready", async () => {
    const { id } = seedAsset({ asset_id: 'ast_1' });

    await deliver('video.asset.ready', { ...readyAsset, status: 'preparing' });

    expect(storedAsset(id)?.isReady).toBe(false);
  });

  it.each([
    ['video.asset.updated', { ...readyAsset, status: 'preparing' }],
    ['video.asset.track.created', { id: 'trk_1', asset_id: 'ast_1', type: 'text', text_type: 'subtitles' }],
    ['video.asset.track.ready', { id: 'trk_1', asset_id: 'ast_1', type: 'text', status: 'ready' }],
    ['video.asset.track.errored', { id: 'trk_1', asset_id: 'ast_1', type: 'text', status: 'errored' }],
    ['video.asset.track.deleted', { id: 'trk_1', asset_id: 'ast_1', type: 'text', status: 'deleted' }],
  ])('%s re-reads the asset from Mux once, after answering', async (type, data) => {
    const { id } = seedAsset({ asset_id: 'ast_1' });
    const fresh = { ...readyAsset, tracks: [...readyAsset.tracks, { id: 'trk_1', type: 'text', status: 'ready' }] };
    getAssetById.mockResolvedValue(fresh);

    const ctx = await deliver(type, data);

    expect(ctx.status).toBe(200);
    expect(getAssetById).not.toHaveBeenCalled();
    expect(storedAsset(id)?.asset_data).toBeUndefined();

    await refreshesSettled();

    expect(getAssetById).toHaveBeenCalledTimes(1);
    expect(getAssetById).toHaveBeenCalledWith('ast_1');
    expect(storedAsset(id)).toMatchObject({ playback_id: 'play_1', isReady: true, asset_data: fresh });
  });

  it('runs one more refresh, not one per event, for events that arrive while a refresh runs', async () => {
    const { id } = seedAsset({ asset_id: 'ast_1' });
    let finishFirstRead: (asset: unknown) => void = () => undefined;
    getAssetById
      .mockImplementationOnce(() => new Promise((resolve) => (finishFirstRead = resolve)))
      .mockResolvedValue({ ...readyAsset, duration: 99 });

    await deliver('video.asset.track.created', { id: 'trk_1', asset_id: 'ast_1' });
    await vi.waitFor(() => expect(getAssetById).toHaveBeenCalledTimes(1));

    await deliver('video.asset.track.ready', { id: 'trk_1', asset_id: 'ast_1' });
    await deliver('video.asset.updated', readyAsset);
    finishFirstRead(readyAsset);
    await refreshesSettled();

    expect(getAssetById).toHaveBeenCalledTimes(2);
    expect(storedAsset(id)?.duration).toBe(99);
  });

  it('reads the asset after video.upload.asset_created, in case video.asset.ready came first', async () => {
    const { id } = seedAsset({ upload_id: 'upl_1', asset_id: null });
    getAssetById.mockResolvedValue(readyAsset);

    expect((await deliver('video.asset.ready', readyAsset)).body).toBe('ignored');
    await deliver('video.upload.asset_created', { id: 'upl_1', asset_id: 'ast_1' });
    await refreshesSettled();

    expect(getAssetById).toHaveBeenCalledWith('ast_1');
    expect(storedAsset(id)).toMatchObject({ asset_id: 'ast_1', playback_id: 'play_1', isReady: true });
  });

  it('reads again when video.asset.ready lands while an older read is still running', async () => {
    const { id } = seedAsset({ asset_id: 'ast_1' });
    let finishStaleRead: (asset: unknown) => void = () => undefined;
    getAssetById
      .mockImplementationOnce(() => new Promise((resolve) => (finishStaleRead = resolve)))
      .mockResolvedValue(readyAsset);

    await deliver('video.asset.track.created', { id: 'trk_1', asset_id: 'ast_1' });
    await vi.waitFor(() => expect(getAssetById).toHaveBeenCalledTimes(1));

    await deliver('video.asset.ready', readyAsset);
    finishStaleRead({ ...readyAsset, status: 'preparing' });
    await refreshesSettled();

    expect(getAssetById).toHaveBeenCalledTimes(2);
    expect(storedAsset(id)?.isReady).toBe(true);
  });

  it('reads at most four assets from Mux at once', async () => {
    const reads: Array<() => void> = [];
    getAssetById.mockImplementation(
      (assetId: string) => new Promise((resolve) => reads.push(() => resolve({ ...readyAsset, id: assetId })))
    );
    const ids = [1, 2, 3, 4, 5, 6].map((n) => `ast_${n}`);
    for (const assetId of ids) seedAsset({ asset_id: assetId });

    for (const assetId of ids) await deliver('video.asset.updated', { ...readyAsset, id: assetId });
    await vi.waitFor(() => expect(getAssetById).toHaveBeenCalledTimes(4));

    reads.shift()!();
    await vi.waitFor(() => expect(getAssetById).toHaveBeenCalledTimes(5));
    reads.shift()!();
    await vi.waitFor(() => expect(getAssetById).toHaveBeenCalledTimes(6));
    reads.splice(0).forEach((finish) => finish());
    await refreshesSettled();

    expect(fake.db.rows(ASSET_MODEL).every((row) => row.isReady)).toBe(true);
  });

  it('keeps the stored snapshot when the refresh fails', async () => {
    const { id } = seedAsset({ asset_id: 'ast_1', asset_data: { id: 'ast_1', status: 'ready' } });
    getAssetById.mockRejectedValue(new Error('Mux is down'));

    await deliver('video.asset.updated', readyAsset);
    await refreshesSettled();

    expect(storedAsset(id)?.asset_data).toEqual({ id: 'ast_1', status: 'ready' });
    expect(fake.log.warn).toHaveBeenCalledWith(expect.stringContaining('Could not refresh Mux asset ast_1'));
  });
});

describe('video events: assets this Strapi does not have', () => {
  it.each([
    ['video.upload.asset_created', { id: 'upl_unknown', asset_id: 'ast_unknown' }],
    ['video.asset.ready', { ...readyAsset, id: 'ast_unknown' }],
    ['video.upload.errored', { id: 'upl_unknown' }],
    ['video.asset.errored', { id: 'ast_unknown', errors: { type: 'invalid_input', messages: [] } }],
    ['video.asset.updated', { ...readyAsset, id: 'ast_unknown' }],
    ['video.asset.track.ready', { id: 'trk_1', asset_id: 'ast_unknown' }],
  ])('%s answers 200 without writing anything', async (type, data) => {
    const existing = seedAsset({ asset_id: 'ast_1', upload_id: 'upl_1' });

    const ctx = await deliver(type, data);
    await refreshesSettled();

    expect(ctx.status).toBe(200);
    expect(ctx.body).toBe('ignored');
    expect(fake.db.query(ASSET_MODEL).update).not.toHaveBeenCalled();
    expect(storedAsset(existing.id)).toEqual(existing);
    expect(getAssetById).not.toHaveBeenCalled();
  });

  it('never resolves an event without an id to the first stored asset', async () => {
    const existing = seedAsset({ asset_id: 'ast_1', upload_id: 'upl_1' });

    const ctx = await deliver('video.upload.asset_created', { asset_id: 'ast_2' });

    expect(ctx.body).toBe('ignored');
    expect(storedAsset(existing.id)).toEqual(existing);
  });

  it('ignores ids that are not strings', async () => {
    const existing = seedAsset({ asset_id: 'ast_1', upload_id: 'upl_1' });

    const ready = await deliver('video.asset.ready', { ...readyAsset, id: { $ne: 'nothing' } });
    const created = await deliver('video.upload.asset_created', { id: { $ne: 'nothing' }, asset_id: 'ast_2' });

    expect([ready.body, created.body]).toEqual(['ignored', 'ignored']);
    expect(storedAsset(existing.id)).toEqual(existing);
  });

  it('ignores event types it has no handler for', async () => {
    const ctx = await deliver('video.live_stream.connected', { id: 'ls_1' });

    expect(ctx.status).toBe(200);
    expect(ctx.body).toBe('ignored');
  });
});
