import { z } from 'zod';

// Field names follow Mux's payloads (snake_case), like the rest of the plugin's stored data.

export type RobotsJobStatus = 'pending' | 'processing' | 'completed' | 'errored' | 'cancelled';

export type RobotsRunStatus = 'pending' | 'dispatching' | 'running' | 'waiting' | 'completed' | 'partial' | 'errored';

/**
 * A row whose create hasn't been matched to a Mux job or run yet: `requested` while the plugin waits
 * for Mux's answer, `unconfirmed` when that answer never came.
 */
export type RobotsPlaceholderStatus = 'requested' | 'unconfirmed';

export const PLACEHOLDER_STATUSES: RobotsPlaceholderStatus[] = ['requested', 'unconfirmed'];

/**
 * How far along a status is. A row only moves to a status of equal or higher rank, so a late or
 * duplicate webhook can't move it backwards. Placeholders rank 0: anything Mux says replaces them.
 */
const JOB_STATUS_RANK: Record<RobotsJobStatus, number> = {
  pending: 1,
  processing: 2,
  completed: 3,
  errored: 3,
  cancelled: 3,
};

const RUN_STATUS_RANK: Record<RobotsRunStatus, number> = {
  pending: 1,
  dispatching: 2,
  running: 3,
  waiting: 3,
  completed: 4,
  partial: 4,
  errored: 4,
};

const TERMINAL_JOB_STATUSES: RobotsJobStatus[] = ['completed', 'errored', 'cancelled'];
const TERMINAL_RUN_STATUSES: RobotsRunStatus[] = ['completed', 'partial', 'errored'];

export const isPlaceholderStatus = (status: unknown): status is RobotsPlaceholderStatus =>
  PLACEHOLDER_STATUSES.includes(status as RobotsPlaceholderStatus);

export const isTerminalJobStatus = (status: unknown): status is RobotsJobStatus =>
  TERMINAL_JOB_STATUSES.includes(status as RobotsJobStatus);

const isTerminalRunStatus = (status: unknown): status is RobotsRunStatus =>
  TERMINAL_RUN_STATUSES.includes(status as RobotsRunStatus);

export const isTerminalRow = (row: Pick<RobotsJobRow, 'status' | 'is_directive_run'>) =>
  row.is_directive_run ? isTerminalRunStatus(row.status) : isTerminalJobStatus(row.status);

export const statusRank = (row: { status?: string | null; is_directive_run?: boolean | null }) => {
  if (!row.status) return 0;

  const ranks: Record<string, number> = row.is_directive_run ? RUN_STATUS_RANK : JOB_STATUS_RANK;

  return ranks[row.status] ?? 0;
};

/** One step of a directive run, as Mux reports it in `node_states`. */
export interface RobotsNodeState {
  reference_id?: string;
  status?: 'dispatched' | 'failed' | 'waiting_for_resources' | 'waiting_for_source_workflow' | string;
  workflow_name?: string;
  /** `dispatched` only. */
  job_id?: string;
  /** `failed` only. */
  reason?: string;
  /** `waiting_for_source_workflow` only. */
  source_workflows?: string[];
}

export interface RobotsRunData {
  node_states?: RobotsNodeState[];
  /** Unix seconds, as Mux sends them. */
  started_at?: number | null;
  completed_at?: number | null;
}

export interface RobotsJobError {
  type?: string;
  message?: string;
  messages?: string[];
  retryable?: boolean;
}

/** A row of the hidden `mux-robot-job` collection: a Robots job, a directive run, or a placeholder. */
export interface RobotsJobRow {
  id: number;
  /** `rjob_…` or `drvrun_…`; null while a create is unconfirmed. */
  mux_id: string | null;
  is_directive_run: boolean;
  /** Catalog key, e.g. `generate-premium-captions`. Null for directive runs. */
  workflow: string | null;
  /** On runs, and on jobs a directive dispatched. */
  directive_id: string | null;
  /** On jobs a directive run dispatched. */
  directive_run_id: string | null;
  status: RobotsJobStatus | RobotsRunStatus | RobotsPlaceholderStatus | string;
  /** The Mux asset id: what the Robots tab queries by. */
  asset_id: string | null;
  parameters: Record<string, unknown> | null;
  /** The whole `outputs` object, as Mux sent it. */
  outputs: Record<string, unknown> | null;
  errors: RobotsJobError[] | null;
  units_consumed: number | null;
  run_data: RobotsRunData | null;
  mux_created_at: string | null;
  mux_updated_at: string | null;
  /** Outputs and units are stored: the job's detail was read, from a webhook or from Mux. */
  detail_loaded: boolean | null;
  /** Placeholders only. Never sent to Mux. */
  request_id: string | null;
  requested_at: string | null;
  /** Admin user id of whoever ran it from this Strapi. */
  requested_by: number | null;
  /** When this Strapi stored the row. */
  createdAt?: string | null;
}

/** The newest completed summarize on an asset, as stored in `robots_outputs.summarize`. */
export interface RobotsSummarizeOutput {
  job_id: string;
  completed_at?: string;
  title?: string;
  description?: string;
  tags?: string[];
}

export interface RobotsModerateOutput {
  job_id: string;
  completed_at?: string;
  exceeds_threshold?: boolean;
  max_scores?: Record<string, number>;
}

/**
 * `mux-asset.robots_outputs`: one slot per workflow, the newest completed job winning. Only these two
 * workflows are kept on the asset; the others' results live on the Mux asset itself (tracks,
 * chapters, thumbnail) or in the job rows.
 */
export interface RobotsOutputs {
  summarize?: RobotsSummarizeOutput;
  moderate?: RobotsModerateOutput;
}

/** Why Mux refused or couldn't be asked. The admin decides what to show from this, never from Mux's status. */
export type RobotsErrorReason =
  | 'scope-missing'
  | 'not-enabled'
  | 'units-exhausted'
  | 'conflict'
  | 'invalid-parameters'
  | 'mux-error'
  | 'unconfirmed'
  | 'create-pending';

export interface RobotsErrorBody {
  error: { reason: RobotsErrorReason; message: string; termsUrl?: string };
}

export type RobotsCapability = 'ok' | 'scope-missing' | 'not-enabled';

export interface RobotsSyncResponse {
  capability: RobotsCapability;
  termsUrl?: string;
  rows: RobotsJobRow[];
  /** Set when Mux couldn't be read for another reason; the stored rows are still returned. */
  error?: RobotsErrorBody['error'];
}

export interface RobotsRowsResponse {
  rows: RobotsJobRow[];
}

export interface RobotsRowResponse {
  row: RobotsJobRow;
  /** The create's outcome is unknown: Mux didn't answer. */
  unconfirmed?: boolean;
}

export interface RobotsDirectiveSummary {
  id: string;
  name: string;
}

export interface RobotsDirectivesResponse {
  directives: RobotsDirectiveSummary[];
  /** False when Mux has more directives than one listing returns, so a missing id proves nothing. */
  complete: boolean;
  defaultDirectiveIds: string[];
  /** Set when Mux couldn't be read: `directives` is then empty and incomplete. */
  error?: RobotsErrorBody['error'];
}

export const RobotsCreateJobBody = z.object({
  workflow: z.string(),
  /** The run form's values, keyed by catalog field name. */
  values: z.record(z.unknown()).default({}),
});

export const RobotsRunDirectiveBody = z.object({ directive_id: z.string().min(1) });

/** How long the tab keeps polling an unfinished job or run before deciding Mux has lost it. */
export const ROBOTS_STALE_MS = 6 * 60 * 60 * 1000;

/** A placeholder reads "Starting…" this long after its request, then "Not confirmed". */
export const ROBOTS_CONFIRM_GRACE_MS = 45 * 1000;

const startedAtMs = (row: Pick<RobotsJobRow, 'mux_created_at' | 'requested_at' | 'createdAt'>) => {
  const ms = Date.parse(row.mux_created_at ?? row.requested_at ?? row.createdAt ?? '');
  return Number.isFinite(ms) ? ms : undefined;
};

export const isPlaceholderRow = (row: Pick<RobotsJobRow, 'mux_id' | 'status'>) =>
  !row.mux_id && isPlaceholderStatus(row.status);

/**
 * Stays "starting" through the grace period even once the server knows Mux didn't answer: Mux may
 * still have received the create, so a re-run isn't offered straight away.
 */
export function placeholderPhase(
  row: Pick<RobotsJobRow, 'requested_at'>,
  nowMs = Date.now()
): 'starting' | 'unconfirmed' {
  const requestedMs = Date.parse(row.requested_at ?? '');
  return Number.isFinite(requestedMs) && nowMs - requestedMs < ROBOTS_CONFIRM_GRACE_MS ? 'starting' : 'unconfirmed';
}

/** A job or run Mux is still working on, recent enough that polling for it is worth it. */
export function isUnfinishedRow(row: RobotsJobRow, nowMs = Date.now()) {
  if (isPlaceholderRow(row) || isTerminalRow(row)) return false;

  // A row nobody can date isn't followed: it would keep the tab polling for as long as it's open.
  const startedMs = startedAtMs(row);
  return startedMs !== undefined && nowMs - startedMs < ROBOTS_STALE_MS;
}

export type RobotsUnitsState =
  | { kind: 'count'; units: number }
  | { kind: 'not-charged' }
  | { kind: 'not-counted-yet' }
  | { kind: 'not-loaded' }
  | { kind: 'not-reported' };

/** What the Mux AI units column says. Every blank says why it's blank. */
export function unitsState(row: RobotsJobRow): RobotsUnitsState {
  if (row.status === 'errored' || row.status === 'cancelled') return { kind: 'not-charged' };
  // Mux reports 0 units until a job finishes.
  if (!isTerminalRow(row)) return { kind: 'not-counted-yet' };
  if (typeof row.units_consumed === 'number') return { kind: 'count', units: row.units_consumed };
  if (!row.detail_loaded) return { kind: 'not-loaded' };
  return { kind: 'not-reported' };
}

/** The first error message Mux gave for a job, whichever shape `errors` has. */
export function firstErrorMessage(errors: unknown): string | undefined {
  const first = Array.isArray(errors) ? errors[0] : errors;
  if (typeof first === 'string') return first;
  if (!first || typeof first !== 'object') return undefined;

  const { message, messages } = first as { message?: unknown; messages?: unknown };
  if (typeof message === 'string' && message) return message;
  if (Array.isArray(messages) && typeof messages[0] === 'string') return messages[0];

  return undefined;
}

/** How long Mux's links to a job's files last after the job completes. */
const TEMPORARY_URL_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

/** A `temporary_*_url` in a job's outputs: Mux's link to a file it made, such as the captions. */
export interface RobotsTemporaryDownload {
  /** The output it came from, e.g. `temporary_vtt_url`. */
  key: string;
  url: string;
  /** Unknown when neither the link nor the job says when it was made. */
  expiresAtMs?: number;
}

/** When a pre-signed S3 link stops working: `X-Amz-Date` plus `X-Amz-Expires` seconds. */
function signedUrlExpiryMs(url: string): number | undefined {
  try {
    const params = new URL(url).searchParams;
    const signedAt = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(params.get('X-Amz-Date') ?? '');
    const lifetimeSeconds = Number(params.get('X-Amz-Expires'));
    if (!signedAt || !Number.isFinite(lifetimeSeconds) || lifetimeSeconds <= 0) return undefined;

    const [year, month, day, hour, minute, second] = signedAt.slice(1).map(Number);
    return Date.UTC(year, month - 1, day, hour, minute, second) + lifetimeSeconds * 1000;
  } catch {
    return undefined;
  }
}

/**
 * The download links in a job's outputs, each with when it expires: what the link itself says, or else
 * 7 days after the job's last update, as Mux documents. Only `https:` links, since they become `href`s.
 */
export function temporaryDownloads(row: Pick<RobotsJobRow, 'outputs' | 'mux_updated_at'>): RobotsTemporaryDownload[] {
  const completedAtMs = row.mux_updated_at ? Date.parse(row.mux_updated_at) : NaN;
  const fallbackExpiryMs = Number.isFinite(completedAtMs) ? completedAtMs + TEMPORARY_URL_LIFETIME_MS : undefined;

  return Object.entries(row.outputs ?? {}).flatMap(([key, url]) =>
    /^temporary_.*_url$/.test(key) && typeof url === 'string' && url.startsWith('https://')
      ? [{ key, url, expiresAtMs: signedUrlExpiryMs(url) ?? fallbackExpiryMs }]
      : []
  );
}

/** A Mux video an entry links to, for the Content Manager's Apply summary panel. */
export interface RobotsEntryVideo {
  id: number;
  title: string;
  asset_id: string | null;
  summary: RobotsSummarizeOutput | null;
}

export interface RobotsEntryVideosResponse {
  /** One per top-level relation to Mux assets, in the content type's order. */
  fields: Array<{ name: string; videos: RobotsEntryVideo[] }>;
}
