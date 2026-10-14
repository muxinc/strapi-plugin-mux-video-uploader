/**
 * Robots data shared by the admin and the server: statuses, the stored job row, the outputs kept on
 * the mux-asset, and what the plugin's Robots routes answer.
 *
 * Field names follow Mux's payloads (snake_case), like the rest of the plugin's stored data.
 */

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
}
