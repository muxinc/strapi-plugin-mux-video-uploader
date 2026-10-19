import { beforeEach, describe, expect, it, vi } from 'vitest';

import { seedAsset } from '../../../test/fixtures';
import { createContext } from '../../../test/koa';
import { FakeStrapi, installFakeStrapi } from '../../../test/strapi';
import { ASSET_MODEL } from '../utils/types';
import mux from './mux';

let fake: FakeStrapi;
let deleteAsset: ReturnType<typeof vi.fn>;
let signPlaybackId: ReturnType<typeof vi.fn>;

beforeEach(() => {
  deleteAsset = vi.fn(async () => true);
  signPlaybackId = vi.fn(async () => ({ token: 'jwt' }));
  fake = installFakeStrapi({ services: { mux: () => ({ deleteAsset, signPlaybackId }) } });
});

describe('deleting a video', () => {
  const remove = async (query: Record<string, unknown>) => {
    const { id } = seedAsset(fake.db);
    const ctx = createContext({ params: { documentId: id }, query, body: {} });
    await mux.deleteMuxAsset(ctx as any);
    return ctx;
  };

  it.each([
    ['"false"', { delete_on_mux: 'false' }],
    ['false', { delete_on_mux: false }],
    ['"0"', { delete_on_mux: '0' }],
  ])('keeps the asset on Mux when delete_on_mux is %s', async (_, query) => {
    const ctx = await remove(query);

    expect(ctx.body).toEqual({ success: true, deletedOnMux: false });
    expect(deleteAsset).not.toHaveBeenCalled();
    expect(fake.db.rows(ASSET_MODEL)).toEqual([]);
  });

  it.each([
    ['"true"', { delete_on_mux: 'true' }],
    ['true', { delete_on_mux: true }],
    ['absent', {}],
  ])('deletes the asset on Mux when delete_on_mux is %s', async (_, query) => {
    const ctx = await remove(query);

    expect(ctx.body).toEqual({ success: true, deletedOnMux: true });
    expect(deleteAsset).toHaveBeenCalledWith('ast_1');
  });
});

describe('signing a playback ID', () => {
  const sign = async (playbackId: string) => {
    const ctx = createContext({ params: { documentId: playbackId }, query: { type: 'video' } });
    await mux.signMuxPlaybackId(ctx as any);
    return ctx;
  };

  it("signs a stored video's playback ID", async () => {
    seedAsset(fake.db, { playback_id: 'play_1', signed: true });

    const ctx = await sign('play_1');

    expect(ctx.status).toBe(200);
    expect(ctx.body).toEqual({ token: 'jwt' });
    expect(signPlaybackId).toHaveBeenCalledWith('play_1', 'video');
  });

  it.each(['play_someone_elses', ''])(
    "answers 404 to %j, which isn't a stored video's, and signs nothing",
    async (id) => {
      seedAsset(fake.db, { playback_id: 'play_1', signed: true });

      const ctx = await sign(id);

      expect(ctx.status).toBe(404);
      expect(signPlaybackId).not.toHaveBeenCalled();
    }
  );
});
