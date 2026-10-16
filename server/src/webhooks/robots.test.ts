import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { isoAt, jobRow, muxJob, placeholderRow, seedAsset } from '../../../test/fixtures';
import { FakeStrapi, installFakeStrapi } from '../../../test/strapi';
import { ASSET_MODEL, ROBOT_JOB_MODEL } from '../utils/types';
import directiveRunPartial from './__fixtures__/robots.directive_run.partial.json';
import { dispatchWebhookEvent } from './index';
import { refreshesSettled } from './refresh-queue';

const T0 = 1791817380;

type Job = Record<string, any>;

const job = (overrides: Job = {}): Job => muxJob({ created_at: T0, updated_at: T0, ...overrides });

const run = (overrides: Job = {}): Job => ({
  id: 'drvrun_1',
  directive_id: 'drv_1',
  asset_id: 'ast_1',
  status: 'pending',
  started_at: T0,
  completed_at: null,
  node_states: [],
  ...overrides,
});

/** Robots events captured from Mux, in the order they arrived. */
const capturedEvents: Array<{ type: string; data: Job }> = readFileSync(
  join(__dirname, '__fixtures__', 'robots-events.m1.ndjson'),
  'utf8'
)
  .trim()
  .split('\n')
  .map((line) => JSON.parse(line));

const captured = (type: string, index = 0) => capturedEvents.filter((event) => event.type === type)[index];

const CAPTURED_ASSET = 'rAREqvuhrU3O34n78mxpABXuarAW7CM7Vy00LREmBu7g';

const jobEvent = (payload: Job) => {
  const type = `robots.job.${String(payload.workflow).replace(/-/g, '_')}.${payload.status}`;
  return { type, id: `evt_${type}`, data: payload };
};

/** A run event: the run in `data`, as Mux sends it, or wrapped the way its directives guide describes. */
const runEvent = (
  event: 'created' | 'completed' | 'partial' | 'errored',
  directiveRun: Job,
  shape: 'data' | 'wrapped' = 'data'
) => {
  const type = `robots.directive_run.${event}`;
  if (shape === 'data') return { type, id: `evt_${type}`, data: directiveRun };

  const body = { created_at: T0, environment_id: 'env_1', internal_id: 'evt_internal', directive_run: directiveRun };
  return { type, id: `evt_${type}`, [type]: body };
};

let fake: FakeStrapi;
let getAssetById: ReturnType<typeof vi.fn>;

beforeEach(() => {
  getAssetById = vi.fn(async (assetId: string) => ({ id: assetId, status: 'ready', playback_ids: [{ id: 'play_1' }] }));
  fake = installFakeStrapi({ services: { mux: () => ({ getAssetById }) } });
});

const rows = () => fake.db.rows(ROBOT_JOB_MODEL);
const asset = (id: number) => fake.db.rows(ASSET_MODEL).find((row) => row.id === id);

describe('Robots events captured from Mux', () => {
  it('stores one row per job and run, each in its final state, and the newest results on the asset', async () => {
    const { id } = seedAsset(fake.db, { asset_id: CAPTURED_ASSET });

    for (const event of capturedEvents) expect(await dispatchWebhookEvent(event)).toBe('handled');
    await refreshesSettled();

    const run = captured('robots.directive_run.completed').data;
    const stored = (muxId: string) => rows().find((row) => row.mux_id === muxId);

    expect(rows()).toHaveLength(5);
    expect(stored(run.id)).toMatchObject({ is_directive_run: true, status: 'completed', asset_id: CAPTURED_ASSET });
    for (const node of run.node_states) {
      expect(stored(node.job_id)).toMatchObject({
        status: 'completed',
        directive_id: run.directive_id,
        directive_run_id: run.id,
      });
    }
    expect(stored(captured('robots.job.generate_premium_captions.completed').data.id)).toMatchObject({
      status: 'completed',
      units_consumed: 371,
      detail_loaded: true,
    });
    expect(asset(id)?.robots_outputs).toMatchObject({
      summarize: { job_id: captured('robots.job.summarize.completed', 1).data.id },
      moderate: { exceeds_threshold: false },
    });
  });

  it('also reads a job nested under the event type', async () => {
    const { type, data } = captured('robots.job.summarize.completed');

    expect(await dispatchWebhookEvent({ type, [type]: data })).toBe('handled');

    expect(rows()).toEqual([
      expect.objectContaining({
        mux_id: data.id,
        workflow: 'summarize',
        status: 'completed',
        asset_id: CAPTURED_ASSET,
        units_consumed: 523,
        outputs: expect.objectContaining({ title: 'Tailwind CSS: The Worst?' }),
        mux_created_at: isoAt(data.created_at),
        detail_loaded: true,
      }),
    ]);
  });

  it('also reads a run wrapped in directive_run', async () => {
    const { data } = captured('robots.directive_run.created');

    await dispatchWebhookEvent(runEvent('created', data, 'wrapped'));

    expect(rows()).toEqual([expect.objectContaining({ mux_id: data.id, directive_id: data.directive_id })]);
  });
});

describe('Robots job webhooks', () => {
  it('keeps one row per job as it goes from pending to processing to completed', async () => {
    seedAsset(fake.db);

    await dispatchWebhookEvent(jobEvent(job({ status: 'pending' })));
    await dispatchWebhookEvent(jobEvent(job({ status: 'processing', updated_at: T0 + 5 })));
    await dispatchWebhookEvent(
      jobEvent(job({ status: 'completed', updated_at: T0 + 60, units_consumed: 3, outputs: { title: 'Done' } }))
    );

    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toMatchObject({ status: 'completed', units_consumed: 3, detail_loaded: true });
  });

  it('never moves a completed job back when a late processing event arrives', async () => {
    seedAsset(fake.db);

    await dispatchWebhookEvent(jobEvent(job({ status: 'completed', updated_at: T0 + 60, units_consumed: 3 })));
    await dispatchWebhookEvent(jobEvent(job({ status: 'processing', updated_at: T0 + 5 })));

    expect(rows()[0]).toMatchObject({ status: 'completed', mux_updated_at: isoAt(T0 + 60) });
  });

  it('treats a duplicate delivery as a no-op', async () => {
    seedAsset(fake.db);
    const event = jobEvent(job({ status: 'completed', units_consumed: 3, outputs: { title: 'Done' } }));

    await dispatchWebhookEvent(event);
    const before = rows();
    const updates = fake.db.query(ROBOT_JOB_MODEL).update.mock.calls.length;
    await dispatchWebhookEvent(event);

    expect(rows()).toEqual(before);
    expect(fake.db.query(ROBOT_JOB_MODEL).update.mock.calls.length).toBe(updates);
  });

  it('fills what a terminal row is missing without changing its status', async () => {
    seedAsset(fake.db);
    fake.db.seed(ROBOT_JOB_MODEL, [jobRow({ status: 'completed' })]);

    await dispatchWebhookEvent(jobEvent(job({ status: 'completed', units_consumed: 4, outputs: { title: 'Done' } })));

    expect(rows()[0]).toMatchObject({ status: 'completed', units_consumed: 4, outputs: { title: 'Done' } });
  });

  it('leaves a finished job loadable from Mux when the event carries neither outputs nor units', async () => {
    seedAsset(fake.db);

    await dispatchWebhookEvent(jobEvent(job({ status: 'completed' })));

    expect(rows()[0].detail_loaded).toBeUndefined();
  });

  it('counts a cancelled job as fully loaded, since Mux has nothing more to give for it', async () => {
    seedAsset(fake.db);

    await dispatchWebhookEvent(jobEvent(job({ status: 'cancelled' })));

    expect(rows()[0]).toMatchObject({ status: 'cancelled', detail_loaded: true });
  });

  it("stores jobs for assets this Strapi doesn't have, so they show if the asset arrives later", async () => {
    await dispatchWebhookEvent(jobEvent(job({ parameters: { asset_id: 'ast_elsewhere' } })));

    expect(rows()).toEqual([expect.objectContaining({ asset_id: 'ast_elsewhere' })]);
  });

  it('records the directive run that dispatched a job', async () => {
    seedAsset(fake.db);

    await dispatchWebhookEvent(jobEvent(job({ directive: { id: 'drv_1', run_id: 'drvrun_1' } })));

    expect(rows()[0]).toMatchObject({ directive_id: 'drv_1', directive_run_id: 'drvrun_1' });
  });

  it.each([
    ['an unknown workflow', { type: 'robots.job.paint_by_numbers.completed', data: job() }],
    ['an event with no job in it', { type: 'robots.job.summarize.completed' }],
  ])('ignores %s', async (_case, event) => {
    expect(await dispatchWebhookEvent(event)).toBe('ignored');
    expect(rows()).toEqual([]);
  });
});

describe('Robots outputs on the asset', () => {
  const summary = (id: string, updatedAt: number, title: string) =>
    job({
      id,
      status: 'completed',
      updated_at: updatedAt,
      outputs: { title, description: `${title}, described`, tags: [title.toLowerCase(), 'mux'] },
    });

  it('writes the summary into robots_outputs, description and tags', async () => {
    const { id } = seedAsset(fake.db);

    await dispatchWebhookEvent(jobEvent(summary('rjob_1', T0 + 60, 'First')));

    expect(asset(id)).toMatchObject({
      description: 'First, described',
      tags: ['first', 'mux'],
      robots_outputs: {
        summarize: {
          job_id: 'rjob_1',
          completed_at: isoAt(T0 + 60),
          title: 'First',
          description: 'First, described',
          tags: ['first', 'mux'],
        },
      },
    });
  });

  it('fills description and tags only while they are empty', async () => {
    const { id } = seedAsset(fake.db, { description: 'Written by hand', tags: [] });

    await dispatchWebhookEvent(jobEvent(summary('rjob_1', T0 + 60, 'First')));
    await dispatchWebhookEvent(jobEvent(summary('rjob_2', T0 + 120, 'Second')));

    expect(asset(id)).toMatchObject({
      description: 'Written by hand',
      tags: ['first', 'mux'],
      robots_outputs: { summarize: { job_id: 'rjob_2', description: 'Second, described' } },
    });
  });

  it("doesn't let an older summary replace a newer one, whatever order they arrive in", async () => {
    const { id } = seedAsset(fake.db);

    await dispatchWebhookEvent(jobEvent(summary('rjob_new', T0 + 120, 'Newer')));
    await dispatchWebhookEvent(jobEvent(summary('rjob_old', T0 + 60, 'Older')));

    expect(asset(id)?.robots_outputs.summarize.job_id).toBe('rjob_new');
    expect(asset(id)?.description).toBe('Newer, described');
  });

  it('breaks a tie in completion time with the greater job id', async () => {
    const { id } = seedAsset(fake.db);

    await dispatchWebhookEvent(jobEvent(summary('rjob_b', T0 + 60, 'B')));
    await dispatchWebhookEvent(jobEvent(summary('rjob_a', T0 + 60, 'A')));

    expect(asset(id)?.robots_outputs.summarize.job_id).toBe('rjob_b');
  });

  it('writes moderation scores into their own slot and leaves the summary alone', async () => {
    const { id } = seedAsset(fake.db, {
      robots_outputs: { summarize: { job_id: 'rjob_s', title: 'Kept' } },
      description: 'Kept',
    });

    await dispatchWebhookEvent(
      jobEvent(
        job({
          id: 'rjob_m',
          workflow: 'moderate',
          status: 'completed',
          updated_at: T0 + 30,
          outputs: { exceeds_threshold: false, max_scores: { sexual: 0.01, violence: 0.02 }, thumbnail_scores: [] },
        })
      )
    );

    expect(asset(id)).toMatchObject({
      description: 'Kept',
      robots_outputs: {
        summarize: { job_id: 'rjob_s', title: 'Kept' },
        moderate: {
          job_id: 'rjob_m',
          completed_at: isoAt(T0 + 30),
          exceeds_threshold: false,
          max_scores: { sexual: 0.01, violence: 0.02 },
        },
      },
    });
  });

  it("doesn't write outputs from another workflow or an unfinished job", async () => {
    const { id } = seedAsset(fake.db);

    await dispatchWebhookEvent(
      jobEvent(job({ workflow: 'find-scenes', status: 'completed', outputs: { scenes: [] } }))
    );
    await dispatchWebhookEvent(jobEvent(job({ id: 'rjob_2', status: 'processing', outputs: { title: 'Early' } })));

    expect(asset(id)?.robots_outputs).toBeUndefined();
  });

  it('re-reads the asset once per completed job, after the event is handled', async () => {
    seedAsset(fake.db);

    await dispatchWebhookEvent(jobEvent(job({ workflow: 'generate-premium-captions', status: 'processing' })));
    await dispatchWebhookEvent(jobEvent(job({ workflow: 'generate-premium-captions', status: 'completed' })));

    expect(getAssetById).not.toHaveBeenCalled();
    await refreshesSettled();
    expect(getAssetById).toHaveBeenCalledTimes(1);
  });
});

describe('Robots placeholders', () => {
  const placeholder = (overrides: Record<string, unknown> = {}) =>
    placeholderRow({ requested_at: isoAt(T0), ...overrides });

  it('turns the placeholder of a create into the job it started', async () => {
    seedAsset(fake.db);
    const [stored] = fake.db.seed(ROBOT_JOB_MODEL, [placeholder()]);

    await dispatchWebhookEvent(jobEvent(job({ created_at: T0 + 2 })));

    expect(rows()).toEqual([
      expect.objectContaining({ id: stored.id, mux_id: 'rjob_1', status: 'pending', requested_by: 1 }),
    ]);
  });

  it.each([
    ['before the request, past the clock tolerance', T0 - 16],
    ['long after the request', T0 + 121],
  ])("doesn't claim a placeholder with a job created %s", async (_case, createdAt) => {
    seedAsset(fake.db);
    fake.db.seed(ROBOT_JOB_MODEL, [placeholder()]);

    await dispatchWebhookEvent(jobEvent(job({ created_at: createdAt })));

    expect(rows()).toHaveLength(2);
    expect(rows()[0]).toMatchObject({ mux_id: null, status: 'unconfirmed' });
  });

  it("doesn't let a job a directive started claim the placeholder of a workflow the plugin asked for", async () => {
    seedAsset(fake.db);
    const [stored] = fake.db.seed(ROBOT_JOB_MODEL, [placeholder()]);

    await dispatchWebhookEvent(jobEvent(job({ created_at: T0 + 2, directive: { id: 'drv_1', run_id: 'drvrun_1' } })));

    expect(rows()).toHaveLength(2);
    expect(rows().find((row) => row.id === stored.id)).toMatchObject({ mux_id: null, status: 'unconfirmed' });
    expect(rows().find((row) => row.mux_id === 'rjob_1')).toMatchObject({ directive_id: 'drv_1' });
  });

  it("doesn't claim a placeholder of another workflow", async () => {
    seedAsset(fake.db);
    fake.db.seed(ROBOT_JOB_MODEL, [placeholder({ workflow: 'moderate' })]);

    await dispatchWebhookEvent(jobEvent(job({ created_at: T0 + 1 })));

    expect(rows()).toHaveLength(2);
  });

  it('claims the placeholder requested closest to the job', async () => {
    seedAsset(fake.db);
    fake.db.seed(ROBOT_JOB_MODEL, [
      placeholder({ request_id: 'far', requested_at: isoAt(T0 - 60) }),
      placeholder({ request_id: 'close', requested_at: isoAt(T0 + 10) }),
    ]);

    await dispatchWebhookEvent(jobEvent(job({ created_at: T0 + 12 })));

    expect(rows().find((row) => row.mux_id === 'rjob_1')?.request_id).toBe('close');
  });

  it('claims the older placeholder when two are equally close', async () => {
    seedAsset(fake.db);
    fake.db.seed(ROBOT_JOB_MODEL, [
      placeholder({ request_id: 'newer', requested_at: isoAt(T0 + 10) }),
      placeholder({ request_id: 'older', requested_at: isoAt(T0 - 10) }),
    ]);

    await dispatchWebhookEvent(jobEvent(job({ created_at: T0 })));

    expect(rows().find((row) => row.mux_id === 'rjob_1')?.request_id).toBe('older');
  });

  it('claims a directive-run placeholder with the run it started', async () => {
    seedAsset(fake.db);
    fake.db.seed(ROBOT_JOB_MODEL, [placeholder({ is_directive_run: true, workflow: null, directive_id: 'drv_1' })]);

    await dispatchWebhookEvent(runEvent('created', run({ started_at: T0 + 3 })));

    expect(rows()).toEqual([
      expect.objectContaining({ mux_id: 'drvrun_1', status: 'pending', request_id: 'abcdef0123456789' }),
    ]);
  });
});

describe('directive run webhooks', () => {
  it.each([
    ['created', 'pending'],
    ['completed', 'completed'],
    ['partial', 'partial'],
    ['errored', 'errored'],
  ] as const)('stores robots.directive_run.%s', async (event, status) => {
    await dispatchWebhookEvent(runEvent(event, run({ status })));

    expect(rows()).toEqual([
      expect.objectContaining({ mux_id: 'drvrun_1', is_directive_run: true, directive_id: 'drv_1', status }),
    ]);
  });

  it('keeps every step and its state in run_data', async () => {
    await dispatchWebhookEvent(directiveRunPartial);

    const [stored] = rows();
    expect(stored).toMatchObject({ mux_id: 'drvrun_1', status: 'partial', asset_id: 'ast_1' });
    expect(stored.run_data.node_states.map((node: any) => node.status)).toEqual([
      'dispatched',
      'failed',
      'waiting_for_resources',
      'waiting_for_source_workflow',
    ]);
    expect(stored.run_data.node_states[1].reason).toBe('The asset has no video track to sample.');
    expect(stored.run_data.node_states[3].source_workflows).toEqual(['premium_captions']);
    expect(stored.run_data).toMatchObject({ started_at: 1791817500, completed_at: 1791817790 });
  });

  it('reads the REST field names too: run_id and subject_id', async () => {
    await dispatchWebhookEvent(
      runEvent('created', { run_id: 'drvrun_2', directive_id: 'drv_1', subject_id: 'ast_1', status: 'pending' })
    );

    expect(rows()).toEqual([expect.objectContaining({ mux_id: 'drvrun_2', asset_id: 'ast_1' })]);
  });

  it('stores only string ids and statuses from a run', async () => {
    await dispatchWebhookEvent(
      runEvent('created', run({ directive_id: { $ne: 'x' }, asset_id: { $ne: 'x' }, status: { $ne: 'x' } }))
    );

    expect(rows()).toEqual([expect.objectContaining({ mux_id: 'drvrun_1', status: 'pending' })]);
    expect(rows()[0].directive_id ?? null).toBeNull();
    expect(rows()[0].asset_id ?? null).toBeNull();
  });

  it('never moves a finished run back, and keeps its steps', async () => {
    await dispatchWebhookEvent(
      runEvent('completed', run({ status: 'completed', node_states: [{ reference_id: 'a', status: 'dispatched' }] }))
    );
    await dispatchWebhookEvent(runEvent('created', run({ status: 'pending', node_states: undefined })));

    expect(rows()[0]).toMatchObject({ status: 'completed', run_data: { node_states: [{ reference_id: 'a' }] } });
  });
});
