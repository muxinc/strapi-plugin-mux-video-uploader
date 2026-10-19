import { beforeEach, describe, expect, it, vi } from 'vitest';

import { jobRow, muxJob, placeholderRow, seedAsset } from '../../../test/fixtures';
import { ContextInit, createContext } from '../../../test/koa';
import { mux, muxApiError, muxConnectionError, page, resetMux } from '../../../test/mux';
import { FakeStrapi, installFakeStrapi } from '../../../test/strapi';
import services from '../services';
import { ASSET_MODEL, ROBOT_JOB_MODEL } from '../utils/types';
import muxAssetController from './mux-asset';
import robots from './robots';

vi.mock('@mux/ts', async () => ({ default: (await import('../../../test/mux')).MuxMock }));

let fake: FakeStrapi;
let assetRowId: number;

beforeEach(() => {
  resetMux();
  fake = installFakeStrapi({ services, config: { defaultDirectiveIds: ['drv_1'] } });
  ({ id: assetRowId } = seedAsset(fake.db, {
    playback_id: 'play_1',
    signed: true,
    asset_data: { id: 'ast_1', status: 'ready', tracks: [{ id: 'trk_video', type: 'video' }] },
  }));
});

const request = (init: ContextInit = {}) =>
  createContext({ state: { user: { id: 3 } }, ...init, params: { asset: String(assetRowId), ...init.params } });

describe('Robots routes', () => {
  it('answers 200 with the row when Mux creates the job', async () => {
    mux.client.robots.jobs.summarize.create.mockResolvedValue(muxJob());
    const ctx = request({ body: { workflow: 'summarize', values: {} } });

    await robots.createJob(ctx as any);

    expect(ctx.status).toBe(200);
    expect(ctx.body.row).toMatchObject({ mux_id: 'rjob_1', requested_by: 3 });
  });

  it("answers 202 when Mux didn't answer", async () => {
    mux.client.robots.jobs.summarize.create.mockRejectedValue(muxConnectionError());
    const ctx = request({ body: { workflow: 'summarize', values: {} } });

    await robots.createJob(ctx as any);

    expect(ctx.status).toBe(202);
    expect(ctx.body).toMatchObject({ unconfirmed: true, row: { status: 'unconfirmed' } });
  });

  it('answers 409 create-pending while an earlier create is unconfirmed', async () => {
    fake.db.seed(ROBOT_JOB_MODEL, [placeholderRow()]);
    const ctx = request({ body: { workflow: 'moderate', values: {} } });

    await robots.createJob(ctx as any);

    expect(ctx.status).toBe(409);
    expect(ctx.body.error.reason).toBe('create-pending');
  });

  it.each([
    [401, 'unauthorized', 'scope-missing'],
    [403, 'forbidden', 'not-enabled'],
  ])("answers 400, never Mux's %i, when the token can't use Robots", async (status, type, reason) => {
    mux.client.robots.jobs.summarize.create.mockRejectedValue(
      muxApiError(status, { error: { type, messages: ['No'] } })
    );
    const ctx = request({ body: { workflow: 'summarize', values: {} } });

    await robots.createJob(ctx as any);

    expect(ctx.status).toBe(400);
    expect(ctx.body).toEqual({
      error: expect.objectContaining({ reason, message: 'No' }),
    });
  });

  it('answers 400 to a body without a workflow, and calls nobody', async () => {
    const ctx = request({ body: { values: {} } });

    await robots.createJob(ctx as any);

    expect(ctx.status).toBe(400);
    expect(mux.client.robots.jobs.summarize.create).not.toHaveBeenCalled();
  });

  it('answers 404 for an asset that does not exist', async () => {
    const ctx = request({ params: { asset: '999' }, body: { workflow: 'summarize', values: {} } });

    await robots.createJob(ctx as any);

    expect(ctx.status).toBe(404);
  });

  it('answers 200 with a capability when sync finds Robots off, never a 403', async () => {
    mux.client.robots.jobs.list.mockRejectedValue(
      muxApiError(403, { error: { type: 'forbidden', messages: ['Off'] } })
    );
    const ctx = request();

    await robots.sync(ctx as any);

    expect(ctx.status).toBe(200);
    expect(ctx.body).toMatchObject({ capability: 'not-enabled', rows: [] });
  });

  it('lists the stored rows without calling Mux', async () => {
    fake.db.seed(ROBOT_JOB_MODEL, [jobRow({ status: 'completed' })]);
    const ctx = request();

    await robots.listJobs(ctx as any);

    expect(ctx.body.rows).toEqual([expect.objectContaining({ mux_id: 'rjob_1' })]);
    expect(mux.options).toHaveLength(0);
  });

  it('answers directives with the configured default ids', async () => {
    mux.client.robots.directives.list.mockResolvedValue(page([{ id: 'drv_1', name: 'Summarize and moderate' }]));
    const ctx = request();

    await robots.listDirectives(ctx as any);

    expect(ctx.body).toEqual({
      directives: [{ id: 'drv_1', name: 'Summarize and moderate' }],
      complete: true,
      defaultDirectiveIds: ['drv_1'],
    });
  });

  it('answers the configured default ids trimmed, without blanks', async () => {
    fake = installFakeStrapi({ services, config: { defaultDirectiveIds: [' drv_1 ', ''] } });
    mux.client.robots.directives.list.mockResolvedValue(page([{ id: 'drv_1', name: 'Summarize and moderate' }]));
    const ctx = request();

    await robots.listDirectives(ctx as any);

    expect(ctx.body.defaultDirectiveIds).toEqual(['drv_1']);
  });

  it('refuses a fractional value for a whole-number field, without calling Mux', async () => {
    const ctx = request({ body: { workflow: 'summarize', values: { title_length: 2.5 } } });

    await robots.createJob(ctx as any);

    expect(ctx.status).toBe(400);
    expect(ctx.body.error.message).toBe('Max title length (words) must be a whole number.');
    expect(mux.client.robots.jobs.summarize.create).not.toHaveBeenCalled();
  });

  it('dismisses a placeholder with 204', async () => {
    const [row] = fake.db.seed(ROBOT_JOB_MODEL, [placeholderRow()]);
    const ctx = createContext({ params: { id: String(row.id) } });

    await robots.dismissPending(ctx as any);

    expect(ctx.status).toBe(204);
    expect(fake.db.rows(ROBOT_JOB_MODEL)).toEqual([]);
  });

  it.each(['findJob', 'cancelJob', 'dismissPending'] as const)(
    '%s answers 404 for a stored row on a video this Strapi does not have',
    async (handler) => {
      const [row] = fake.db.seed(ROBOT_JOB_MODEL, [jobRow({ mux_id: 'rjob_9', asset_id: 'ast_elsewhere' })]);
      const ctx = createContext({ params: { id: String(row.id) } });

      await robots[handler](ctx as any);

      expect(ctx.status).toBe(404);
      expect(mux.client.robots.jobs.cancel).not.toHaveBeenCalled();
      expect(fake.db.rows(ROBOT_JOB_MODEL)).toHaveLength(1);
    }
  );

  it('loads a job from Mux only when asked to', async () => {
    const [row] = fake.db.seed(ROBOT_JOB_MODEL, [jobRow({ status: 'completed' })]);
    mux.client.robots.jobs.summarize.retrieve.mockResolvedValue(
      muxJob({ status: 'completed', units_consumed: 2, outputs: { title: 'T' } })
    );

    const plain = createContext({ params: { id: String(row.id) } });
    await robots.findJob(plain as any);
    expect(mux.client.robots.jobs.summarize.retrieve).not.toHaveBeenCalled();

    const loaded = createContext({ params: { id: String(row.id) }, query: { load: '1' } });
    await robots.findJob(loaded as any);
    expect(loaded.body.row).toMatchObject({ units_consumed: 2, detail_loaded: true });
  });
});

describe('Create playback ID', () => {
  it("creates one with the asset's policy and stores the fresh asset", async () => {
    await fake.db.query(ASSET_MODEL).update({ where: { id: assetRowId }, data: { playback_id: null } });
    mux.client.video.assets.createPlaybackId.mockResolvedValue({ id: 'play_new', policy: 'signed' });
    mux.client.video.assets.retrieve.mockResolvedValue({
      id: 'ast_1',
      status: 'ready',
      playback_ids: [{ id: 'play_new', policy: 'signed' }],
    });
    const ctx = request();

    await muxAssetController.createPlaybackId(ctx as any);

    expect(mux.client.video.assets.createPlaybackId).toHaveBeenCalledWith('ast_1', { policy: 'signed' });
    expect(ctx.body.asset).toMatchObject({ playback_id: 'play_new' });
  });

  it('stores the fresh asset on every video on that Mux asset', async () => {
    await fake.db.query(ASSET_MODEL).update({ where: { id: assetRowId }, data: { playback_id: null } });
    const other = seedAsset(fake.db, { title: 'The same video again', playback_id: null, signed: true });
    mux.client.video.assets.createPlaybackId.mockResolvedValue({ id: 'play_new', policy: 'signed' });
    mux.client.video.assets.retrieve.mockResolvedValue({
      id: 'ast_1',
      status: 'ready',
      playback_ids: [{ id: 'play_new', policy: 'signed' }],
    });
    const ctx = request();

    await muxAssetController.createPlaybackId(ctx as any);

    expect(ctx.body.asset).toMatchObject({ id: assetRowId, playback_id: 'play_new' });
    expect(fake.db.rows(ASSET_MODEL).find((row) => row.id === other.id)?.playback_id).toBe('play_new');
  });

  it('does nothing when the video still has a playback ID', async () => {
    const ctx = request();

    await muxAssetController.createPlaybackId(ctx as any);

    expect(mux.client.video.assets.createPlaybackId).not.toHaveBeenCalled();
    expect(ctx.body.asset.playback_id).toBe('play_1');
  });
});
