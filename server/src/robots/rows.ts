import {
  isTerminalJobStatus,
  isTerminalRow,
  PLACEHOLDER_STATUSES,
  RobotsJobRow,
  RobotsNodeState,
  RobotsRunData,
  statusRank,
} from '../../../types/robots';
import { ROBOT_JOB_MODEL } from '../utils/types';
import { compact, isRecord, nonEmptyString } from '../utils/values';

// Every write here belongs inside `withAssetLock` for the row's asset.

/** What any source says about one job or run. `undefined` means "this source doesn't know". */
export type IncomingRow = Partial<Omit<RobotsJobRow, 'id'>> & { mux_id: string; is_directive_run: boolean };

/** A job as Mux describes it: a webhook, a single read, a create or cancel answer, or a list summary. */
export interface MuxJobLike {
  id: string;
  workflow?: string;
  status?: string;
  created_at?: number;
  updated_at?: number;
  parameters?: object;
  outputs?: object;
  errors?: unknown;
  units_consumed?: number;
  directive?: { id?: string; run_id?: string };
}

/** A directive run as a webhook (`id`, `asset_id`) or the REST API (`run_id`, `subject_id`) describes it. */
export interface MuxRunLike {
  id?: string;
  run_id?: string;
  directive_id?: string;
  asset_id?: string;
  subject_id?: string;
  status?: string;
  node_states?: RobotsNodeState[];
  started_at?: number;
  completed_at?: number | null;
}

/** Mux timestamps are Unix seconds. */
export const isoFromSeconds = (seconds: unknown) =>
  typeof seconds === 'number' && Number.isFinite(seconds) ? new Date(seconds * 1000).toISOString() : undefined;

export const secondsFromDate = (value: unknown) => {
  const ms = value instanceof Date ? value.getTime() : typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isFinite(ms) ? ms / 1000 : undefined;
};

export function rowFromJob(
  job: MuxJobLike,
  { workflow, assetId, detail }: { workflow: string; assetId?: string | null; detail: boolean }
): IncomingRow {
  const parameters = isRecord(job.parameters) ? job.parameters : undefined;
  const jobAssetId = typeof parameters?.asset_id === 'string' ? parameters.asset_id : undefined;

  return compact({
    mux_id: job.id,
    is_directive_run: false,
    workflow,
    status: nonEmptyString(job.status),
    asset_id: jobAssetId ?? assetId ?? undefined,
    directive_id: nonEmptyString(job.directive?.id),
    directive_run_id: nonEmptyString(job.directive?.run_id),
    parameters,
    outputs: isRecord(job.outputs) ? job.outputs : undefined,
    errors: Array.isArray(job.errors) || isRecord(job.errors) ? (job.errors as RobotsJobRow['errors']) : undefined,
    // Mux reports 0 until a job finishes, and a list summary can still say 0 for a finished one. A
    // finished row only fills empty fields, so a 0 stored then would hide the real count.
    units_consumed:
      detail && isTerminalJobStatus(job.status) && typeof job.units_consumed === 'number'
        ? job.units_consumed
        : undefined,
    mux_created_at: isoFromSeconds(job.created_at),
    mux_updated_at: isoFromSeconds(job.updated_at),
    // Outputs and units exist only once a job has finished, and count as stored only when this copy
    // carries them; otherwise they're read from Mux on demand. A cancelled job has nothing to read.
    detail_loaded:
      detail &&
      isTerminalJobStatus(job.status) &&
      (job.status === 'cancelled' ||
        typeof job.units_consumed === 'number' ||
        job.outputs !== undefined ||
        job.errors !== undefined)
        ? true
        : undefined,
  }) as IncomingRow;
}

export function rowFromRun(
  run: MuxRunLike,
  { directiveId, assetId, status }: { directiveId?: string; assetId?: string | null; status?: string } = {}
): IncomingRow | undefined {
  const muxId = nonEmptyString(run.id ?? run.run_id);
  if (!muxId) return undefined;

  return compact({
    mux_id: muxId,
    is_directive_run: true,
    directive_id: nonEmptyString(run.directive_id) ?? directiveId,
    status: nonEmptyString(run.status) ?? status,
    asset_id: nonEmptyString(run.asset_id) ?? nonEmptyString(run.subject_id) ?? assetId ?? undefined,
    run_data: compact({
      node_states: Array.isArray(run.node_states) ? run.node_states : undefined,
      started_at: run.started_at,
      completed_at: run.completed_at,
    }) as RobotsRunData,
    mux_created_at: isoFromSeconds(run.started_at),
    mux_updated_at: isoFromSeconds(run.completed_at),
  }) as IncomingRow;
}

const comparable = (value: unknown) => (value instanceof Date ? value.toISOString() : value);
const sameValue = (a: unknown, b: unknown) => JSON.stringify(comparable(a)) === JSON.stringify(comparable(b));
const isEmpty = (value: unknown) => value === null || value === undefined;

/**
 * What to change on `row` given `incoming`, or `null` when nothing would change. A row never moves
 * backwards, whatever order copies arrive in:
 *
 * - A terminal row never changes status again, but a later copy may fill its empty fields: a list
 *   summary has no outputs, the webhook that follows does.
 * - Otherwise a status ranked at least the stored one applies, with the rest of what it says.
 * - Anything older only fills empty fields, so duplicates and late deliveries are no-ops.
 */
export function mergeIntoRow(row: RobotsJobRow, incoming: IncomingRow): Partial<RobotsJobRow> | null {
  const incomingRank = statusRank(incoming);
  const advances = !isTerminalRow(row) && incomingRank > 0 && incomingRank >= statusRank(row);
  const update: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(incoming)) {
    if (value === undefined || key === 'mux_id' || key === 'is_directive_run') continue;

    const current = (row as unknown as Record<string, unknown>)[key];

    if (key === 'status') {
      if (advances && value !== current) update.status = value;
    } else if (key === 'detail_loaded') {
      if (value === true && current !== true) update.detail_loaded = true;
    } else if (key === 'run_data') {
      // Node states and timestamps arrive piecemeal: a newer copy adds to what's known, an older one only fills gaps.
      const stored = isRecord(current) ? current : {};
      const merged = advances
        ? { ...stored, ...compact(value as RobotsRunData) }
        : { ...compact(value as RobotsRunData), ...stored };
      if (!sameValue(merged, current)) update.run_data = merged;
    } else if (advances ? !sameValue(current, value) : isEmpty(current) && !isEmpty(value)) {
      update[key] = value;
    }
  }

  return Object.keys(update).length > 0 ? (update as Partial<RobotsJobRow>) : null;
}

export const robotJobs = () => strapi.db.query(ROBOT_JOB_MODEL);

export async function findRowById(id: number): Promise<RobotsJobRow | null> {
  return (await robotJobs().findOne({ where: { id } })) as RobotsJobRow | null;
}

export async function findRowByMuxId(muxId: string): Promise<RobotsJobRow | null> {
  return (await robotJobs().findOne({ where: { mux_id: muxId }, orderBy: { id: 'asc' } })) as RobotsJobRow | null;
}

const CLAIM_WINDOW_BEFORE_S = 15;
const CLAIM_WINDOW_AFTER_S = 120;

export interface ClaimCriteria {
  assetId: string | null | undefined;
  /** Jobs claim job placeholders of their workflow, runs the placeholders of their directive. */
  workflow?: string | null;
  directiveId?: string | null;
  /** Unix seconds: the job's `created_at`, or the run's `started_at`. */
  at: number | undefined;
}

/**
 * The placeholder a job or run seen for the first time resolves, if any: same asset, same workflow
 * (or directive), started within the claim window around the request. The closest request wins; ties
 * go to the older placeholder. The window is lopsided on purpose: a job created before the request
 * can't be its result, and the time before only absorbs clocks that disagree.
 */
async function findClaimablePlaceholder(
  isDirectiveRun: boolean,
  criteria: ClaimCriteria
): Promise<RobotsJobRow | null> {
  const { assetId, at } = criteria;
  const kind = isDirectiveRun ? criteria.directiveId : criteria.workflow;
  if (!assetId || typeof at !== 'number' || !kind) return null;

  const kindFilter = isDirectiveRun ? { directive_id: kind } : { workflow: kind };

  const placeholders = (await robotJobs().findMany({
    where: {
      asset_id: assetId,
      is_directive_run: isDirectiveRun,
      status: { $in: PLACEHOLDER_STATUSES },
      mux_id: { $null: true },
      ...kindFilter,
    },
  })) as RobotsJobRow[];

  const candidates = placeholders.flatMap((placeholder) => {
    const requestedAt = secondsFromDate(placeholder.requested_at);
    if (requestedAt === undefined) return [];
    if (at < requestedAt - CLAIM_WINDOW_BEFORE_S || at > requestedAt + CLAIM_WINDOW_AFTER_S) return [];
    return [{ placeholder, requestedAt, distance: Math.abs(at - requestedAt) }];
  });

  candidates.sort(
    (a, b) => a.distance - b.distance || a.requestedAt - b.requestedAt || a.placeholder.id - b.placeholder.id
  );

  return candidates[0]?.placeholder ?? null;
}

/**
 * Writes what a source says about a job or run: onto its row when the Mux id is known, else onto the
 * placeholder it resolves, else as a new row. Returns the row as stored.
 */
export async function upsertRobotsRow(incoming: IncomingRow, claim?: ClaimCriteria): Promise<RobotsJobRow> {
  const existing = await findRowByMuxId(incoming.mux_id);

  if (existing) {
    const update = mergeIntoRow(existing, incoming);
    if (!update) return existing;

    return (await robotJobs().update({ where: { id: existing.id }, data: update })) as RobotsJobRow;
  }

  // A job a directive started belongs to that directive's run, never to a workflow the plugin asked for.
  const startedByDirective = !incoming.is_directive_run && !!incoming.directive_id;
  const placeholder =
    claim && !startedByDirective ? await findClaimablePlaceholder(incoming.is_directive_run, claim) : null;

  if (placeholder) {
    const update = mergeIntoRow(placeholder, incoming) ?? {};

    return (await robotJobs().update({
      where: { id: placeholder.id },
      data: { ...update, mux_id: incoming.mux_id },
    })) as RobotsJobRow;
  }

  return (await robotJobs().create({ data: incoming })) as RobotsJobRow;
}
