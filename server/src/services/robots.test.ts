import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  mux,
  muxApiError,
  muxConnectionError,
  muxTimeoutError,
  page,
  resetMux,
  WORKFLOW_SDK_KEYS,
} from '../../../test/mux';
import { isoAt, jobRow, muxJob, placeholderRow, seedAsset, unixNow } from '../../../test/fixtures';
import { FakeStrapi, installFakeStrapi } from '../../../test/strapi';
import { ROBOTS_CATALOG } from '../../../types/robots-catalog';
import { MuxError } from '@mux/ts/core/error';

import { RobotsRequestError } from '../robots/errors';
import { ASSET_MODEL, ROBOT_JOB_MODEL } from '../utils/types';
import { dispatchWebhookEvent } from '../webhooks';
import services from './index';
import { ROBOTS_PASSTHROUGH } from './robots';

vi.mock('@mux/ts', async () => ({ default: (await import('../../../test/mux')).MuxMock }));

const assetData = {
  id: 'ast_1',
  status: 'ready',
  duration: 120,
  tracks: [
    { id: 'trk_video', type: 'video' },
    { id: 'trk_audio', type: 'audio' },
    { id: 'trk_en', type: 'text', text_type: 'subtitles', status: 'ready', language_code: 'en', name: 'English' },
  ],
};

let fake: FakeStrapi;
let muxAsset: Record<string, any>;

const robots = () => fake.strapi.plugin('mux-video-uploader').service('robots');
const rows = () => fake.db.rows(ROBOT_JOB_MODEL);

const createSummarize = (values: Record<string, unknown> = {}) =>
  robots().createJob({ userId: 7, muxAsset, workflow: 'summarize', values });

beforeEach(() => {
  resetMux();
  fake = installFakeStrapi({ services });
  muxAsset = seedAsset(fake.db, { playback_id: 'play_1', asset_data: assetData });
});

describe('creating a job', () => {
  it('turns the placeholder into the job once Mux answers', async () => {
    mux.client.robots.jobs.summarize.create.mockResolvedValue(
      muxJob({ parameters: { asset_id: 'ast_1', tone: 'neutral' } })
    );

    const result = await createSummarize({ tone: 'neutral' });

    expect(result.unconfirmed).toBeUndefined();
    expect(rows()).toEqual([
      expect.objectContaining({
        id: result.row.id,
        mux_id: 'rjob_1',
        status: 'pending',
        workflow: 'summarize',
        asset_id: 'ast_1',
        requested_by: 7,
        request_id: expect.stringMatching(/^[0-9a-f]{16}$/),
        parameters: { asset_id: 'ast_1', tone: 'neutral' },
      }),
    ]);
  });

  it('calls Mux once, with the parameters built from the catalog and the Strapi passthrough', async () => {
    mux.client.robots.jobs.summarize.create.mockResolvedValue(muxJob());

    await createSummarize({ tone: 'neutral', update_asset_meta: false, 'output_steering.audience': '' });

    expect(mux.client.robots.jobs.summarize.create).toHaveBeenCalledTimes(1);
    expect(mux.client.robots.jobs.summarize.create).toHaveBeenCalledWith({
      parameters: { asset_id: 'ast_1', tone: 'neutral', update_asset_meta: false },
      passthrough: 'mux:cms:strapi:',
    });
  });

  it('drops the placeholder and reports the reason when Mux refuses', async () => {
    mux.client.robots.jobs.summarize.create.mockRejectedValue(
      muxApiError(403, { error: { type: 'robots_units_limit_exceeded', messages: ['Not enough units left.'] } })
    );

    await expect(createSummarize()).rejects.toMatchObject({
      status: 400,
      reason: 'units-exhausted',
      message: 'Not enough units left.',
    });
    expect(rows()).toEqual([]);
  });

  it.each([
    ['a connection error', muxConnectionError()],
    ['a timeout', muxTimeoutError()],
  ])('keeps the placeholder as unconfirmed after %s', async (_case, error) => {
    mux.client.robots.jobs.summarize.create.mockRejectedValue(error);

    const result = await createSummarize();

    expect(result).toMatchObject({ unconfirmed: true, row: { status: 'unconfirmed', mux_id: null } });
    expect(rows()).toEqual([expect.objectContaining({ status: 'unconfirmed', requested_by: 7 })]);
    expect(mux.client.robots.jobs.summarize.create).toHaveBeenCalledTimes(1);
  });

  it('drops the placeholder when the SDK refuses the request before sending it', async () => {
    mux.client.robots.jobs.summarize.create.mockRejectedValue(
      new MuxError('Path parameters result in path with invalid segments')
    );

    await expect(createSummarize()).rejects.toMatchObject({ status: 400, reason: 'invalid-parameters' });
    expect(rows()).toEqual([]);
  });

  it('refuses a second run while Mux has not confirmed the first', async () => {
    fake.db.seed(ROBOT_JOB_MODEL, [placeholderRow()]);

    await expect(createSummarize()).rejects.toMatchObject({ status: 409, reason: 'create-pending' });
    expect(mux.client.robots.jobs.summarize.create).not.toHaveBeenCalled();
  });

  it('lets a workflow run while a directive run is unconfirmed, but not the other way round', async () => {
    fake.db.seed(ROBOT_JOB_MODEL, [placeholderRow({ is_directive_run: true, workflow: null, directive_id: 'drv_1' })]);
    mux.client.robots.jobs.summarize.create.mockResolvedValue(muxJob());

    await expect(createSummarize()).resolves.toBeDefined();

    fake.db.seed(ROBOT_JOB_MODEL, [placeholderRow({ request_id: 'second' })]);
    await expect(robots().runDirective({ userId: 7, muxAsset, directiveId: 'drv_2' })).rejects.toMatchObject({
      status: 409,
      reason: 'create-pending',
    });
  });

  it('keeps one row when the webhook claims the placeholder before Mux answers the create', async () => {
    mux.client.robots.jobs.summarize.create.mockImplementation(async () => {
      await dispatchWebhookEvent({
        type: 'robots.job.summarize.processing',
        'robots.job.summarize.processing': muxJob({ status: 'processing' }),
      });
      return muxJob({ status: 'pending' });
    });

    const result = await createSummarize();

    expect(rows()).toEqual([expect.objectContaining({ id: result.row.id, mux_id: 'rjob_1', status: 'processing' })]);
  });

  it("keeps the webhook's row and drops the placeholder when the job was stored without it", async () => {
    mux.client.robots.jobs.summarize.create.mockImplementation(async () => {
      fake.db.seed(ROBOT_JOB_MODEL, [jobRow()]);
      return muxJob({ status: 'pending' });
    });

    const result = await createSummarize();

    expect(rows()).toEqual([expect.objectContaining({ mux_id: 'rjob_1', status: 'processing', requested_by: 7 })]);
    expect(result.row.mux_id).toBe('rjob_1');
  });

  it('takes the request back when a webhook gave its placeholder to another job of the workflow', async () => {
    mux.client.robots.jobs.summarize.create.mockImplementation(async () => {
      await dispatchWebhookEvent({
        type: 'robots.job.summarize.processing',
        'robots.job.summarize.processing': muxJob({ id: 'rjob_elsewhere', status: 'processing' }),
      });
      return muxJob({ status: 'pending' });
    });

    const result = await createSummarize();

    expect(rows()).toHaveLength(2);
    expect(rows().find((row) => row.mux_id === 'rjob_elsewhere')).toMatchObject({
      status: 'processing',
      request_id: null,
      requested_by: null,
    });
    expect(result.row).toMatchObject({
      mux_id: 'rjob_1',
      status: 'pending',
      requested_by: 7,
      request_id: expect.stringMatching(/^[0-9a-f]{16}$/),
    });
  });

  it.each(['constructor', '__proto__', 'toString'])('answers 400 to the workflow name %s', async (workflow) => {
    await expect(robots().createJob({ userId: 7, muxAsset, workflow, values: {} })).rejects.toMatchObject({
      status: 400,
      reason: 'invalid-parameters',
    });
    expect(rows()).toEqual([]);
  });

  it('refuses values the catalog rejects without calling Mux', async () => {
    await expect(createSummarize({ prompt_overrides: 'x' })).rejects.toMatchObject({
      status: 400,
      reason: 'invalid-parameters',
    });
    await expect(
      robots().createJob({ userId: 7, muxAsset, workflow: 'find-best-thumbnails', values: { max_thumbnails: 9 } })
    ).rejects.toMatchObject({
      reason: 'invalid-parameters',
      message: 'Maximum candidates must be at most 5.',
    });
    await expect(robots().createJob({ userId: 7, muxAsset, workflow: 'paint', values: {} })).rejects.toBeInstanceOf(
      RobotsRequestError
    );
    expect(rows()).toEqual([]);
  });

  it('refuses to run on a video that is not ready', async () => {
    muxAsset = { ...muxAsset, isReady: false };

    await expect(createSummarize()).rejects.toMatchObject({
      status: 400,
      message: 'Robots can run once the video is ready.',
    });
  });

  it.each(ROBOTS_CATALOG.map((definition) => [definition.key, definition.sdkKey] as const))(
    'creates %s through client.robots.jobs.%s',
    async (workflow, sdkKey) => {
      const values: Record<string, Record<string, unknown>> = {
        'edit-captions': { track_id: 'trk_en', censor_profanity: true },
        'translate-captions': { track_id: 'trk_en', to_language_code: 'es' },
        'translate-audio': { to_language_code: 'es' },
        'ask-questions': { questions: [{ question: 'Is there a dog?', answerOptions: '', answerMode: 'options' }] },
      };
      mux.client.robots.jobs[sdkKey].create.mockResolvedValue(muxJob({ workflow }));

      await robots().createJob({ userId: 7, muxAsset, workflow, values: values[workflow] ?? {} });

      expect(mux.client.robots.jobs[sdkKey].create).toHaveBeenCalledWith({
        parameters: expect.objectContaining({ asset_id: 'ast_1' }),
        passthrough: ROBOTS_PASSTHROUGH,
      });
      for (const other of WORKFLOW_SDK_KEYS.filter((key) => key !== sdkKey)) {
        expect(mux.client.robots.jobs[other].create).not.toHaveBeenCalled();
      }
    }
  );
});

describe('running a directive', () => {
  it('sends only the asset id, and records the run', async () => {
    mux.client.robots.directives.runs.create.mockResolvedValue({
      run_id: 'drvrun_1',
      status: 'pending',
      subject_id: 'ast_1',
    });

    const result = await robots().runDirective({ userId: 7, muxAsset, directiveId: 'drv_1' });

    expect(mux.client.robots.directives.runs.create).toHaveBeenCalledWith('drv_1', { asset_id: 'ast_1' });
    expect(result.row).toMatchObject({
      mux_id: 'drvrun_1',
      is_directive_run: true,
      directive_id: 'drv_1',
      status: 'pending',
      requested_by: 7,
    });
  });

  it('runs a directive whose id is as long as the ones Mux issues', async () => {
    const directiveId =
      'drv_MTaW02700ZT8CG2pioGxp1863qkOx01vzp300oVMADWQRPYSfUankfdkI49iVXEa00YvridiaFeHnvwVJfEPgN2kqmw';
    mux.client.robots.directives.runs.create.mockResolvedValue({
      run_id: 'drvrun_1',
      status: 'pending',
      subject_id: 'ast_1',
    });

    const result = await robots().runDirective({ userId: 7, muxAsset, directiveId });

    expect(result.row).toMatchObject({ mux_id: 'drvrun_1', directive_id: directiveId });
  });

  it.each(['', '..', 'drv/../../video/v1/assets', 'x'.repeat(256)])(
    'refuses the directive id %j without calling Mux',
    async (directiveId) => {
      await expect(robots().runDirective({ userId: 7, muxAsset, directiveId })).rejects.toMatchObject({
        status: 400,
        reason: 'invalid-parameters',
      });
      expect(mux.client.robots.directives.runs.create).not.toHaveBeenCalled();
      expect(rows()).toEqual([]);
    }
  );

  it('says the directive is already running when Mux answers 409', async () => {
    mux.client.robots.directives.runs.create.mockRejectedValue(muxApiError(409, { error: { messages: ['Conflict'] } }));

    await expect(robots().runDirective({ userId: 7, muxAsset, directiveId: 'drv_1' })).rejects.toMatchObject({
      reason: 'conflict',
      message: 'That directive is already running on this video.',
    });
    expect(rows()).toEqual([]);
  });
});

describe('syncing an asset', () => {
  it('reads the jobs list once and stores the jobs the plugin has not seen', async () => {
    mux.client.robots.jobs.list.mockResolvedValue(
      page([
        muxJob({ id: 'rjob_a', status: 'completed', parameters: undefined, units_consumed: 0 }),
        muxJob({ id: 'rjob_b', workflow: 'moderate', status: 'processing', parameters: undefined, units_consumed: 0 }),
      ])
    );

    const result = await robots().syncAsset(muxAsset);

    expect(mux.client.robots.jobs.list).toHaveBeenCalledTimes(1);
    expect(mux.client.robots.jobs.list).toHaveBeenCalledWith({ asset_id: 'ast_1', limit: 100 });
    expect(result.capability).toBe('ok');
    expect(result.rows.map((row: any) => [row.mux_id, row.status, row.detail_loaded ?? false])).toEqual(
      expect.arrayContaining([
        ['rjob_a', 'completed', false],
        ['rjob_b', 'processing', false],
      ])
    );
  });

  it('settles an unconfirmed create the list shows, inside the time window', async () => {
    const requestedAt = unixNow() - 30;
    fake.db.seed(ROBOT_JOB_MODEL, [placeholderRow({ requested_at: isoAt(requestedAt) })]);
    mux.client.robots.jobs.list.mockResolvedValue(
      page([muxJob({ created_at: requestedAt + 2, status: 'processing' })])
    );

    const result = await robots().syncAsset(muxAsset);

    expect(result.rows).toEqual([expect.objectContaining({ mux_id: 'rjob_1', status: 'processing', requested_by: 1 })]);
  });

  it('leaves a placeholder alone when the only job of its workflow started outside the window', async () => {
    const requestedAt = unixNow() - 600;
    fake.db.seed(ROBOT_JOB_MODEL, [placeholderRow({ requested_at: isoAt(requestedAt) })]);
    mux.client.robots.jobs.list.mockResolvedValue(page([muxJob({ created_at: requestedAt + 300 })]));

    await robots().syncAsset(muxAsset);

    expect(rows()).toHaveLength(2);
    expect(rows()[0]).toMatchObject({ mux_id: null, status: 'unconfirmed' });
  });

  it.each([
    ['scope-missing', muxApiError(401, { error: { type: 'unauthorized', messages: ['Unauthorized'] } }), undefined],
    [
      'not-enabled',
      muxApiError(403, { error: { type: 'forbidden', messages: ['See https://dashboard.mux.com/robots/terms'] } }),
      'https://dashboard.mux.com/robots/terms',
    ],
  ])('answers %s with the stored rows', async (capability, error, termsUrl) => {
    fake.db.seed(ROBOT_JOB_MODEL, [jobRow({ mux_id: 'rjob_old', status: 'completed' })]);
    mux.client.robots.jobs.list.mockRejectedValue(error);

    const result = await robots().syncAsset(muxAsset);

    expect(result).toMatchObject({ capability, rows: [expect.objectContaining({ mux_id: 'rjob_old' })] });
    expect(result.termsUrl).toBe(termsUrl);
  });

  it("says it couldn't reach Mux, and still answers with what's stored", async () => {
    mux.client.robots.jobs.list.mockRejectedValue(muxConnectionError());

    expect(await robots().syncAsset(muxAsset)).toEqual({
      capability: 'ok',
      rows: [],
      error: { reason: 'unconfirmed', message: "Couldn't reach Mux." },
    });
  });
});

describe('other job actions', () => {
  const stored = (overrides: Record<string, unknown> = {}) =>
    fake.db.seed(ROBOT_JOB_MODEL, [jobRow(overrides)])[0] as any;

  it('cancels a running job and records the status Mux answers with', async () => {
    const row = stored();
    mux.client.robots.jobs.cancel.mockResolvedValue(muxJob({ status: 'cancelled', parameters: undefined }));

    const result = await robots().cancelJob(row);

    expect(mux.client.robots.jobs.cancel).toHaveBeenCalledWith('rjob_1');
    expect(result).toMatchObject({ id: row.id, status: 'cancelled' });
  });

  it('reads a finished job once and stores its outputs and units', async () => {
    const row = stored({ status: 'completed', detail_loaded: false });
    mux.client.robots.jobs.summarize.retrieve.mockResolvedValue(
      muxJob({
        status: 'completed',
        units_consumed: 5,
        outputs: { title: 'Loaded', description: 'From Mux', tags: ['a'] },
      })
    );

    const result = await robots().loadJobDetail(row);

    expect(mux.client.robots.jobs.summarize.retrieve).toHaveBeenCalledWith('rjob_1');
    expect(result).toMatchObject({ units_consumed: 5, detail_loaded: true, outputs: { title: 'Loaded' } });
    expect(fake.db.rows(ASSET_MODEL)[0]).toMatchObject({ description: 'From Mux', tags: ['a'] });

    await robots().loadJobDetail(result);
    expect(mux.client.robots.jobs.summarize.retrieve).toHaveBeenCalledTimes(1);
  });

  it("doesn't read an unfinished job", async () => {
    const row = stored();

    expect(await robots().loadJobDetail(row)).toEqual(row);
    expect(mux.client.robots.jobs.summarize.retrieve).not.toHaveBeenCalled();
  });

  it('lists directives and says when the listing may be incomplete', async () => {
    mux.client.robots.directives.list.mockResolvedValue(
      page([
        { id: 'drv_1', name: 'Summarize and moderate' },
        { id: 'drv_2', name: '' },
      ])
    );

    expect(await robots().listDirectives()).toEqual({
      directives: [
        { id: 'drv_1', name: 'Summarize and moderate' },
        { id: 'drv_2', name: 'drv_2' },
      ],
      complete: true,
    });

    mux.client.robots.directives.list.mockResolvedValue(
      page(Array.from({ length: 100 }, (_, i) => ({ id: `drv_${i}`, name: 'x' })))
    );
    expect((await robots().listDirectives()).complete).toBe(false);
  });

  it('dismisses an unconfirmed placeholder, and nothing else', async () => {
    const [unconfirmed] = fake.db.seed(ROBOT_JOB_MODEL, [placeholderRow()]);
    const job1 = stored();

    await robots().dismissPending(unconfirmed as any);
    await robots().dismissPending(job1);

    expect(rows()).toEqual([expect.objectContaining({ mux_id: 'rjob_1' })]);
  });
});
