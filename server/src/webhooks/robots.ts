import { workflowByEventKey } from '../../../types/robots-catalog';
import type { RobotsApiVersion } from '../../../types/robots';
import { withAssetLock } from '../robots/lock';
import { writeOutputs } from '../robots/outputs';
import { MuxJobLike, MuxRunLike, rowFromJob, rowFromRun, upsertRobotsRow } from '../robots/rows';
import { eventPayload } from './payload';
import { scheduleAssetRefresh } from './refresh-queue';
import type { WebhookEvent, WebhookOutcome } from './types';

/** `…directive_run.<event>` names the event; the run's own `status` wins when it has one. */
const RUN_STATUS_BY_EVENT: Record<string, string> = {
  created: 'pending',
  completed: 'completed',
  partial: 'partial',
  errored: 'errored',
};

/**
 * Each version sends its own events, for the jobs and runs it created: v0 ones keep arriving for
 * jobs that were running when Strapi was upgraded, and for every run of a v0 directive.
 */
const NAMESPACES: Array<{ prefix: string; version: RobotsApiVersion; kind: 'job' | 'run' }> = [
  { prefix: 'robots.v1.job.', version: 'v1', kind: 'job' },
  { prefix: 'robots.v1.directive_run.', version: 'v1', kind: 'run' },
  { prefix: 'robots.job.', version: 'v0', kind: 'job' },
  { prefix: 'robots.directive_run.', version: 'v0', kind: 'run' },
];

export async function handleRobotsEvent(event: WebhookEvent): Promise<WebhookOutcome> {
  const namespace = NAMESPACES.find(({ prefix }) => event.type.startsWith(prefix));
  if (!namespace) return 'ignored';

  return namespace.kind === 'job'
    ? handleRobotsJob(event, namespace.version)
    : handleDirectiveRun(event, namespace.version);
}

/** `robots.v1.job.<eventKey>.<status>`, or `robots.job.<eventKey>.<status>` on v0. */
async function handleRobotsJob(event: WebhookEvent, apiVersion: RobotsApiVersion): Promise<WebhookOutcome> {
  const [eventKey, eventStatus] = event.type.split('.').slice(-2);
  const workflow = workflowByEventKey(eventKey);

  if (!workflow) {
    strapi.log.info(`[mux-video-uploader] Ignoring ${event.type}: unknown Robots workflow`);
    return 'ignored';
  }

  const payload = eventPayload(event) as Partial<MuxJobLike> | undefined;

  if (!payload || typeof payload.id !== 'string') {
    strapi.log.warn(`[mux-video-uploader] Ignoring ${event.type}: no job in the payload`);
    return 'ignored';
  }

  const job = { ...payload, status: payload.status ?? eventStatus } as MuxJobLike;
  const row = rowFromJob(job, { workflow: workflow.key, detail: true, apiVersion });
  const assetId = row.asset_id ?? null;
  const completed = job.status === 'completed' && !!assetId;

  await withAssetLock(assetId, async () => {
    await upsertRobotsRow(row, { assetId, workflow: workflow.key, at: job.created_at });

    if (completed) await writeOutputs(assetId, workflow.key, job);
  });

  // Any workflow may have changed the asset: tracks, chapters, thumbnail, title or playback IDs.
  if (completed) scheduleAssetRefresh(assetId);

  return 'handled';
}

/** `robots.v1.directive_run.<event>`, or `robots.directive_run.<event>` on v0. */
async function handleDirectiveRun(event: WebhookEvent, apiVersion: RobotsApiVersion): Promise<WebhookOutcome> {
  const wrapped = eventPayload(event);
  const run = (wrapped?.directive_run ?? wrapped) as MuxRunLike | undefined;
  const status = RUN_STATUS_BY_EVENT[event.type.split('.').slice(-1)[0]];
  const row = run && rowFromRun(run, { status, apiVersion });

  if (!run || !row) {
    strapi.log.warn(`[mux-video-uploader] Ignoring ${event.type}: no directive run in the payload`);
    return 'ignored';
  }

  await withAssetLock(row.asset_id, () =>
    upsertRobotsRow(row, { assetId: row.asset_id, directiveId: row.directive_id, at: run.started_at })
  );

  return 'handled';
}
