import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createContext } from '../../../test/koa';
import { mux, page, resetMux } from '../../../test/mux';
import { FakeStrapi, installFakeStrapi } from '../../../test/strapi';
import services from '../services';
import { ASSET_MODEL, TEXT_TRACK_MODEL } from '../utils/types';
import muxController from './mux';

vi.mock('@mux/ts', async () => ({ default: (await import('../../../test/mux')).MuxMock }));

let fake: FakeStrapi;

const upload = (body: Record<string, unknown>, canRunRobots: boolean) =>
  createContext({
    body: { title: 'A video', upload_type: 'file', ...body },
    headers: { origin: 'http://localhost:1337' },
    state: {
      userAbility: { can: (action: string) => canRunRobots && action === 'plugin::mux-video-uploader.robots.run' },
    },
  });

beforeEach(() => {
  resetMux();
  fake = installFakeStrapi({ services, config: { defaultDirectiveIds: ['drv_a', 'drv_b'] } });
  mux.client.video.uploads.create.mockResolvedValue({ id: 'upl_1', url: 'https://storage.example/upload' });
  mux.client.robots.directives.list.mockResolvedValue(
    page([
      { id: 'drv_a', name: 'A' },
      { id: 'drv_b', name: 'B' },
    ])
  );
});

describe('uploads with default directives', () => {
  it('ignores the directives someone without Run Robots unchecked', async () => {
    const ctx = upload({ directives: [] }, false);

    await muxController.postDirectUpload(ctx as any);

    expect(mux.client.video.uploads.create.mock.calls[0][0].new_asset_settings.directives).toEqual([
      { id: 'drv_a' },
      { id: 'drv_b' },
    ]);
    expect(fake.db.rows(ASSET_MODEL)).toEqual([expect.objectContaining({ upload_id: 'upl_1', title: 'A video' })]);
  });

  it('attaches only what a runner kept checked', async () => {
    const ctx = upload({ directives: ['drv_b'] }, true);

    await muxController.postDirectUpload(ctx as any);

    expect(mux.client.video.uploads.create.mock.calls[0][0].new_asset_settings.directives).toEqual([{ id: 'drv_b' }]);
  });

  it('sends no directives key when nothing is attached', async () => {
    const ctx = upload({ directives: [] }, true);

    await muxController.postDirectUpload(ctx as any);

    expect(mux.client.video.uploads.create.mock.calls[0][0].new_asset_settings).not.toHaveProperty('directives');
  });
});

describe('upload titles', () => {
  const caption = {
    name: 'English',
    language_code: 'en',
    file: { contents: 'WEBVTT', type: 'text/vtt', name: 'en.vtt', size: 6 },
  };

  beforeEach(() => {
    mux.client.video.assets.create.mockResolvedValue({ id: 'ast_1' });
    fake.strapi.entityService = { create: vi.fn(async () => ({ id: 1, documentId: 'doc_1' })) };
  });

  it.each([
    ['shorter than 3 characters', 'ab'],
    ['blank', '     '],
    ['2 characters once trimmed', '  ab  '],
    ['longer than 255 characters', 'x'.repeat(256)],
  ])('refuses a title %s with a 400, before anything reaches Mux', async (_, title) => {
    const remote = upload({ title, upload_type: 'url', url: 'https://example.com/video.mp4' }, true);
    const direct = upload({ title, custom_text_tracks: [caption] }, true);

    await muxController.postRemoteUpload(remote as any);
    await muxController.postDirectUpload(direct as any);

    expect([remote.status, direct.status]).toEqual([400, 400]);
    expect(remote.body.error.message).toBe('ValidationError');
    expect(mux.client.video.assets.create).not.toHaveBeenCalled();
    expect(mux.client.video.uploads.create).not.toHaveBeenCalled();
    expect(mux.client.robots.directives.list).not.toHaveBeenCalled();
    expect(fake.strapi.entityService.create).not.toHaveBeenCalled();
    expect(fake.db.rows(ASSET_MODEL)).toEqual([]);
    expect(fake.db.rows(TEXT_TRACK_MODEL)).toEqual([]);
  });

  it('stores the title trimmed', async () => {
    const ctx = upload({ title: '  A remote video  ', upload_type: 'url', url: 'https://example.com/video.mp4' }, true);

    await muxController.postRemoteUpload(ctx as any);

    expect(ctx.status).toBe(200);
    expect(fake.db.rows(ASSET_MODEL)).toEqual([
      expect.objectContaining({ asset_id: 'ast_1', title: 'A remote video' }),
    ]);
  });
});
