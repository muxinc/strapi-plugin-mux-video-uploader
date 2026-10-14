import { workflowByEventKey } from '../../../types/robots-catalog';
import { withAssetLock } from '../robots/lock';
import { writeOutputs } from '../robots/outputs';
import { MuxJobLike, MuxRunLike, rowFromJob, rowFromRun, upsertRobotsRow } from '../robots/rows';
import { eventPayload } from './payload';
import { scheduleAssetRefresh } from './refresh-queue';
import type { WebhookEvent, WebhookOutcome } from './types';

/** `robots.directive_run.<event>` names the event; the run's own `status` wins when it has one. */
const RUN_STATUS_BY_EVENT: Record<string, string> = {
  created: 'pending',
  completed: 'completed',
  partial: 'partial',
  errored: 'errored',
};

export async function handleRobotsEvent(event: WebhookEvent): Promise<WebhookOutcome> {
  if (event.type.startsWith('robots.job.')) return handleRobotsJob(event);
  if (event.type.startsWith('robots.directive_run.')) return handleDirectiveRun(event);

  return 'ignored';
}

/** `robots.job.<eventKey>.<status>` */
async function handleRobotsJob(event: WebhookEvent): Promise<WebhookOutcome> {
  const [, , eventKey, eventStatus] = event.type.split('.');
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
  const row = rowFromJob(job, { workflow: workflow.key, detail: true });
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

/** `robots.directive_run.<event>` */
async function handleDirectiveRun(event: WebhookEvent): Promise<WebhookOutcome> {
  const wrapped = eventPayload(event);
  const run = (wrapped?.directive_run ?? wrapped) as MuxRunLike | undefined;
  const row = run && rowFromRun(run, { status: RUN_STATUS_BY_EVENT[event.type.split('.')[2]] });

  if (!run || !row) {
    strapi.log.warn(`[mux-video-uploader] Ignoring ${event.type}: no directive run in the payload`);
    return 'ignored';
  }

  await withAssetLock(row.asset_id, () =>
    upsertRobotsRow(row, { assetId: row.asset_id, directiveId: row.directive_id, at: run.started_at })
  );

  return 'handled';
}
