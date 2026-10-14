import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createContext } from '../../../test/koa';
import { mux, page, resetMux } from '../../../test/mux';
import { FakeStrapi, installFakeStrapi } from '../../../test/strapi';
import services from '../services';
import { ASSET_MODEL } from '../utils/types';
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
