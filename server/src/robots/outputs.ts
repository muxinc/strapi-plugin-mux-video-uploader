import {
  isNewerSlot,
  type RobotsAnalyzeStructureOutput,
  type RobotsJobRow,
  type RobotsModerateOutput,
  type RobotsOutputs,
  type RobotsSummarizeOutput,
} from '../../../types/robots';
import { normalizeTags } from '../../../types/shared-types';
import { findMuxAssets } from '../utils/resolve-mux-asset';
import { ASSET_MODEL } from '../utils/types';
import { compact, isRecord } from '../utils/values';
import { withAssetLock } from './lock';
import { isoFromSeconds, MuxJobLike, robotJobs, secondsFromDate } from './rows';

type SlotKey = keyof RobotsOutputs;
type Slot = RobotsSummarizeOutput | RobotsModerateOutput | RobotsAnalyzeStructureOutput;

const outputsOf = (job: MuxJobLike) => (isRecord(job.outputs) ? job.outputs : {});

const textOf = (value: unknown) => (typeof value === 'string' ? value : undefined);

function tagsOf(outputs: Record<string, unknown>) {
  const tags = normalizeTags(
    Array.isArray(outputs.tags) ? outputs.tags.filter((tag): tag is string => typeof tag === 'string') : []
  );
  return tags.length > 0 ? tags : undefined;
}

function summarizeSlot(job: MuxJobLike): RobotsSummarizeOutput | undefined {
  const outputs = outputsOf(job);
  const slot = compact({
    job_id: job.id,
    completed_at: isoFromSeconds(job.updated_at),
    title: textOf(outputs.title),
    description: textOf(outputs.description),
    tags: tagsOf(outputs),
  });

  return slot.title || slot.description || slot.tags ? slot : undefined;
}

function moderateSlot(job: MuxJobLike): RobotsModerateOutput | undefined {
  const outputs = outputsOf(job);
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

function analyzeStructureSlot(job: MuxJobLike): RobotsAnalyzeStructureOutput | undefined {
  const outputs = outputsOf(job);
  const slot = compact({
    job_id: job.id,
    completed_at: isoFromSeconds(job.updated_at),
    title: textOf(outputs.title),
    summary: textOf(outputs.summary),
    tags: tagsOf(outputs),
  });

  return slot.title || slot.summary || slot.tags ? slot : undefined;
}

/** The workflows whose newest result is kept on the asset, and the slot each one fills. */
const SLOTS: Record<string, { key: SlotKey; build: (job: MuxJobLike) => Slot | undefined }> = {
  summarize: { key: 'summarize', build: summarizeSlot },
  moderate: { key: 'moderate', build: moderateSlot },
  'analyze-structure': { key: 'analyze_structure', build: analyzeStructureSlot },
};

const SLOT_WORKFLOWS = Object.keys(SLOTS);

/** What a slot gives the video's own `description`, which only a summary fills. */
function descriptionOf(key: SlotKey, slot: Slot): string | undefined {
  if (key === 'summarize') return (slot as RobotsSummarizeOutput).description;
  if (key === 'analyze_structure') return (slot as RobotsAnalyzeStructureOutput).summary;
  return undefined;
}

/**
 * Whether `candidate` should replace `current`: the newer one wins (see `isNewerSlot`). The same job
 * only rewrites its slot when what it says changed.
 */
function isNewerOutput(current: unknown, candidate: Slot): boolean {
  if (!isRecord(current) || typeof current.job_id !== 'string') return true;
  if (current.job_id === candidate.job_id) return JSON.stringify(current) !== JSON.stringify(candidate);

  return isNewerSlot(current, candidate);
}

/** The slot a completed job fills, if its workflow keeps one, it describes `assetId`, and it says anything. */
function slotFromJob(assetId: string, workflow: string, job: MuxJobLike) {
  if (!Object.prototype.hasOwnProperty.call(SLOTS, workflow) || job.status !== 'completed') return undefined;

  const parameters = isRecord(job.parameters) ? job.parameters : {};
  if (parameters.asset_id !== assetId) return undefined;

  const { key, build } = SLOTS[workflow];
  const slot = build(job);
  return slot && { key, slot };
}

/** Writes `slot` onto every mux-asset row of `assetId` that `shouldReplace` lets it replace. */
async function writeSlot(
  assetId: string,
  key: SlotKey,
  slot: Slot,
  shouldReplace: (current: unknown, candidate: Slot) => boolean = isNewerOutput
) {
  for (const muxAsset of await findMuxAssets({ asset_id: assetId })) {
    const outputs = isRecord(muxAsset.robots_outputs) ? (muxAsset.robots_outputs as RobotsOutputs) : {};
    if (!shouldReplace(outputs[key], slot)) continue;

    const data: Record<string, unknown> = { robots_outputs: { ...outputs, [key]: slot } };

    // Only empty fields are filled: what's already there, typed by someone or from an earlier summary,
    // is replaced only through Apply summary.
    const description = descriptionOf(key, slot);
    const tags = key === 'moderate' ? undefined : (slot as RobotsSummarizeOutput | RobotsAnalyzeStructureOutput).tags;
    const hasDescription = typeof muxAsset.description === 'string' && muxAsset.description.trim() !== '';
    const hasTags = Array.isArray(muxAsset.tags) && muxAsset.tags.length > 0;

    if (!hasDescription && description) data.description = description;
    if (!hasTags && tags?.length) data.tags = tags;

    await strapi.db.query(ASSET_MODEL).update({ where: { id: muxAsset.id }, data });
  }
}

/**
 * Folds a completed summarize, moderate or analyze-structure job into its asset's `robots_outputs`
 * (and `description` and `tags`), one slot per workflow, whoever ran it. Only from a job whose
 * `parameters.asset_id` is that asset: an output describes one video.
 */
export async function writeOutputs(assetId: string, workflow: string, job: MuxJobLike) {
  const found = slotFromJob(assetId, workflow, job);
  if (found) await writeSlot(assetId, found.key, found.slot);
}

const jobFromRow = (row: RobotsJobRow): MuxJobLike => ({
  id: row.mux_id ?? '',
  status: row.status,
  updated_at: secondsFromDate(row.mux_updated_at),
  parameters: row.parameters ?? undefined,
  outputs: row.outputs ?? undefined,
});

/**
 * Writes the newest stored results onto the asset's rows. A job can finish before its asset reaches
 * this Strapi, and its webhook then had no row to write to.
 *
 * Runs on every Robots sync, so a slot already holding the same job is left alone: rewriting it would
 * fill a description or tags someone cleared on purpose.
 */
export async function backfillOutputs(assetId: string) {
  const slots: Array<{ key: SlotKey; slot: Slot }> = [];

  for (const workflow of SLOT_WORKFLOWS) {
    const rows = (await robotJobs().findMany({
      where: { asset_id: assetId, workflow, status: 'completed', is_directive_run: false, mux_id: { $notNull: true } },
      orderBy: { id: 'asc' },
    })) as RobotsJobRow[];

    let newest: { key: SlotKey; slot: Slot } | undefined;
    for (const row of rows) {
      const found = slotFromJob(assetId, workflow, jobFromRow(row));
      if (found && isNewerOutput(newest?.slot, found.slot)) newest = found;
    }
    if (newest) slots.push(newest);
  }

  // Newest first: only empty fields are filled, so the summary Apply summary offers is the one that fills them.
  slots.sort((a, b) => (isNewerSlot(a.slot, b.slot) ? 1 : -1));

  for (const { key, slot } of slots) {
    await writeSlot(
      assetId,
      key,
      slot,
      (current, candidate) =>
        !(isRecord(current) && current.job_id === candidate.job_id) && isNewerOutput(current, candidate)
    );
  }
}

/**
 * For a request that has already created the asset on Mux: a failure is logged, never thrown, since
 * an error there would make the user retry and create, and bill, a second asset.
 */
export async function tryBackfillOutputs(assetId: string) {
  try {
    await withAssetLock(assetId, () => backfillOutputs(assetId));
  } catch (error) {
    strapi.log.warn(
      `[mux-video-uploader] Couldn't write stored Robots results to Mux asset ${assetId}: ${
        error instanceof Error ? error.message : error
      }`
    );
  }
}
