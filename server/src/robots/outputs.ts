import type { RobotsJobRow, RobotsModerateOutput, RobotsOutputs, RobotsSummarizeOutput } from '../../../types/robots';
import { findMuxAssets } from '../utils/resolve-mux-asset';
import { ASSET_MODEL } from '../utils/types';
import { compact, isRecord } from '../utils/values';
import { isoFromSeconds, MuxJobLike, robotJobs, secondsFromDate } from './rows';

type OutputWorkflow = keyof RobotsOutputs;

function summarizeSlot(job: MuxJobLike): RobotsSummarizeOutput | undefined {
  const outputs = isRecord(job.outputs) ? job.outputs : {};
  const tags = Array.isArray(outputs.tags) ? outputs.tags.filter((tag): tag is string => typeof tag === 'string') : [];

  const slot = compact({
    job_id: job.id,
    completed_at: isoFromSeconds(job.updated_at),
    title: typeof outputs.title === 'string' ? outputs.title : undefined,
    description: typeof outputs.description === 'string' ? outputs.description : undefined,
    tags: tags.length > 0 ? tags : undefined,
  });

  return slot.title || slot.description || slot.tags ? slot : undefined;
}

function moderateSlot(job: MuxJobLike): RobotsModerateOutput | undefined {
  const outputs = isRecord(job.outputs) ? job.outputs : {};
  const scores = isRecord(outputs.max_scores)
    ? Object.fromEntries(Object.entries(outputs.max_scores).filter(([, score]) => typeof score === 'number'))
    : {};

  const slot = compact({
    job_id: job.id,
    completed_at: isoFromSeconds(job.updated_at),
    exceeds_threshold: typeof outputs.exceeds_threshold === 'boolean' ? outputs.exceeds_threshold : undefined,
    max_scores: Object.keys(scores).length > 0 ? (scores as Record<string, number>) : undefined,
  });

  return slot.exceeds_threshold !== undefined || slot.max_scores ? slot : undefined;
}

const SLOTS: Record<OutputWorkflow, (job: MuxJobLike) => RobotsSummarizeOutput | RobotsModerateOutput | undefined> = {
  summarize: summarizeSlot,
  moderate: moderateSlot,
};

/** Missing or unreadable reads as oldest, so a damaged slot can't pin itself forever. */
const completionTime = (slot: { completed_at?: unknown }) => secondsFromDate(slot.completed_at) ?? 0;

/**
 * Whether `candidate` should replace `current`: the newer completion wins, ties going to the greater
 * job id, so every order of delivery settles on the same slot. The same job only rewrites its slot
 * when what it says changed.
 */
function isNewerOutput(current: unknown, candidate: { job_id: string; completed_at?: string }): boolean {
  if (!isRecord(current) || typeof current.job_id !== 'string') return true;
  if (current.job_id === candidate.job_id) return JSON.stringify(current) !== JSON.stringify(candidate);

  const currentAt = completionTime(current);
  const candidateAt = completionTime(candidate);

  return candidateAt > currentAt || (candidateAt === currentAt && candidate.job_id > current.job_id);
}

/** The slot a completed summarize or moderate job fills, if it describes `assetId` and says anything. */
function slotFromJob(assetId: string, workflow: string, job: MuxJobLike) {
  if (!Object.prototype.hasOwnProperty.call(SLOTS, workflow) || job.status !== 'completed') return undefined;

  const parameters = isRecord(job.parameters) ? job.parameters : {};
  if (parameters.asset_id !== assetId) return undefined;

  return SLOTS[workflow as OutputWorkflow](job);
}

/** Writes `slot` onto every mux-asset row of `assetId` that `shouldReplace` lets it replace. */
async function writeSlot(
  assetId: string,
  workflow: OutputWorkflow,
  slot: RobotsSummarizeOutput | RobotsModerateOutput,
  shouldReplace: (current: unknown, candidate: typeof slot) => boolean = isNewerOutput
) {
  for (const muxAsset of await findMuxAssets({ asset_id: assetId })) {
    const outputs = isRecord(muxAsset.robots_outputs) ? (muxAsset.robots_outputs as RobotsOutputs) : {};
    if (!shouldReplace(outputs[workflow], slot)) continue;

    const data: Record<string, unknown> = { robots_outputs: { ...outputs, [workflow]: slot } };

    // Only empty fields are filled: what's already there, typed by someone or from an earlier summary,
    // is replaced only through Apply summary.
    if (workflow === 'summarize') {
      const summary = slot as RobotsSummarizeOutput;
      const hasDescription = typeof muxAsset.description === 'string' && muxAsset.description.trim() !== '';
      const hasTags = Array.isArray(muxAsset.tags) && muxAsset.tags.length > 0;

      if (!hasDescription && summary.description) data.description = summary.description;
      if (!hasTags && summary.tags?.length) data.tags = summary.tags;
    }

    await strapi.db.query(ASSET_MODEL).update({ where: { id: muxAsset.id }, data });
  }
}

/**
 * Folds a completed summarize or moderate job into its asset's `robots_outputs` (and `description` and
 * `tags`), one slot per workflow, whoever ran it. Only from a job whose `parameters.asset_id` is that
 * asset: an output describes one video.
 */
export async function writeOutputs(assetId: string, workflow: string, job: MuxJobLike) {
  const slot = slotFromJob(assetId, workflow, job);
  if (slot) await writeSlot(assetId, workflow as OutputWorkflow, slot);
}

const jobFromRow = (row: RobotsJobRow): MuxJobLike => ({
  id: row.mux_id ?? '',
  status: row.status,
  updated_at: secondsFromDate(row.mux_updated_at),
  parameters: row.parameters ?? undefined,
  outputs: row.outputs ?? undefined,
});

/**
 * Writes the newest stored summarize and moderate results onto the asset's rows. A job can finish
 * before its asset reaches this Strapi, and its webhook then had no row to write to.
 *
 * Runs on every Robots sync, so a slot already holding the same job is left alone: rewriting it would
 * fill a description or tags someone cleared on purpose.
 */
export async function backfillOutputs(assetId: string) {
  for (const workflow of Object.keys(SLOTS) as OutputWorkflow[]) {
    const rows = (await robotJobs().findMany({
      where: { asset_id: assetId, workflow, status: 'completed', is_directive_run: false, mux_id: { $notNull: true } },
      orderBy: { id: 'asc' },
    })) as RobotsJobRow[];

    let newest: RobotsSummarizeOutput | RobotsModerateOutput | undefined;
    for (const row of rows) {
      const slot = slotFromJob(assetId, workflow, jobFromRow(row));
      if (slot && isNewerOutput(newest, slot)) newest = slot;
    }

    if (newest) {
      await writeSlot(
        assetId,
        workflow,
        newest,
        (current, candidate) =>
          !(isRecord(current) && current.job_id === candidate.job_id) && isNewerOutput(current, candidate)
      );
    }
  }
}
