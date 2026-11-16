import { randomBytes } from 'node:crypto';

import {
  assetContextFrom,
  isRunnableWorkflow,
  paramsFromFormValues,
  robotsValuesSchema,
  RobotsWorkflowDefinition,
  validateParams,
  workflowByKey,
  workflowUnavailableReason,
} from '../../../types/robots-catalog';
import {
  apiVersionFromHref,
  isTerminalRow,
  PLACEHOLDER_STATUSES,
  RobotsApiVersion,
  RobotsDirectiveSummary,
  RobotsJobRow,
  RobotsRowResponse,
  RobotsSyncResponse,
  statusRank,
} from '../../../types/robots';
import { MuxAsset } from '../content-types/mux-asset/types';
import { callMux, classifyMuxError, isNotFound, RobotsRequestError } from '../robots/errors';
import { withAssetLock } from '../robots/lock';
import { backfillOutputs, writeOutputs } from '../robots/outputs';
import {
  findRowById,
  findRowByMuxId,
  IncomingRow,
  mergeIntoRow,
  MuxJobLike,
  robotJobs,
  rowFromJob,
  rowFromRun,
  secondsFromDate,
  upsertRobotsRow,
} from '../robots/rows';
import { getMuxClient } from './mux';

/** Marks the jobs this plugin creates. Directive runs can't carry it: their create body is only `asset_id`. */
export const ROBOTS_PASSTHROUGH = 'mux:cms:strapi:';

/** The most rows the Robots tab shows for one asset. */
const MAX_ROWS = 100;

const DIRECTIVES_PAGE_SIZE = 100;

/** What a Mux id looks like, up to the column it's stored in. Anything else never reaches the SDK. */
const MUX_ID = /^[A-Za-z0-9_-]{1,255}$/;

/** 64 random bits, never sent to Mux: it only tells placeholders apart. */
const newRequestId = () => randomBytes(8).toString('hex');

/** Everything Strapi starts goes to Robots v1. v0 is only read, for jobs and runs it created. */
const CREATE_VERSION: RobotsApiVersion = 'v1';

type MuxClient = Awaited<ReturnType<typeof getMuxClient>>;

interface WorkflowJobs {
  create(body: object): PromiseLike<unknown>;
  retrieve(jobId: string): PromiseLike<unknown>;
}

/** One workflow's resource on one Robots version. Find scenes has none on v1. */
function workflowJobs(client: MuxClient, version: RobotsApiVersion, definition: RobotsWorkflowDefinition) {
  const jobs = version === 'v1' ? client.robots.jobs : client.robotsV0.jobs;
  const resource = (jobs as unknown as Record<string, WorkflowJobs | undefined>)[definition.sdkKey];
  if (!resource)
    throw new RobotsRequestError(400, 'invalid-parameters', `${definition.label} isn't in Robots ${version}.`);
  return resource;
}

/**
 * The versions to read a stored job through, in order. A row stored before 4.0 doesn't know its own:
 * those versions created only on v0, but stored the v1 jobs Mux's v0 listing returned too.
 */
const versionsToRead = (row: RobotsJobRow, definition: RobotsWorkflowDefinition): RobotsApiVersion[] =>
  definition.legacy ? ['v0'] : row.api_version ? [row.api_version] : ['v0', 'v1'];

const JOB_GONE = "Mux no longer has this job: it deletes jobs 30 days after they're created.";

/**
 * Calls Mux for a stored job on each of its possible versions, moving on only after a 404: any other
 * answer is the job's. Says which version answered.
 */
async function onJobVersion<T>(
  row: RobotsJobRow,
  definition: RobotsWorkflowDefinition,
  request: (client: MuxClient, version: RobotsApiVersion) => PromiseLike<T>
): Promise<{ result: T; version: RobotsApiVersion }> {
  return callMux(async () => {
    const client = await getMuxClient();

    for (const version of versionsToRead(row, definition)) {
      try {
        return { result: await request(client, version), version };
      } catch (error) {
        if (!isNotFound(error)) throw error;
      }
    }

    throw new RobotsRequestError(400, 'mux-error', JOB_GONE);
  });
}

const sortTime = (row: RobotsJobRow) => secondsFromDate(row.mux_created_at ?? row.requested_at) ?? 0;

/** Newest first. Queried by Mux asset id, so jobs stored before the asset reached this Strapi still show. */
async function listRows(assetId: string): Promise<RobotsJobRow[]> {
  const rows = (await robotJobs().findMany({
    where: { asset_id: assetId },
    orderBy: { id: 'desc' },
    // Over-fetched so the duplicates dropped below still leave a full list.
    limit: MAX_ROWS * 3,
  })) as RobotsJobRow[];

  // Two deliveries racing on different server instances can store a job twice. Show the furthest-along copy.
  const best = new Map<string, RobotsJobRow>();
  for (const row of rows) {
    if (!row.mux_id) continue;
    const seen = best.get(row.mux_id);
    if (!seen || statusRank(row) > statusRank(seen)) best.set(row.mux_id, row);
  }
  const deduped = rows.filter((row) => !row.mux_id || best.get(row.mux_id) === row);

  return deduped.sort((a, b) => sortTime(b) - sortTime(a) || b.id - a.id).slice(0, MAX_ROWS);
}

const requireReadyAsset = (muxAsset: MuxAsset) => {
  if (!muxAsset.asset_id || !muxAsset.isReady) {
    throw new RobotsRequestError(400, 'invalid-parameters', 'Robots can run once the video is ready.');
  }
  return muxAsset.asset_id;
};

/**
 * Inserts the placeholder for a create, unless one is already waiting. A job placeholder blocks
 * running workflows; any placeholder blocks running directives.
 */
async function insertPlaceholder(assetId: string, kind: 'job' | 'run', data: Partial<RobotsJobRow>) {
  return withAssetLock(assetId, async () => {
    const waiting = (await robotJobs().findMany({
      where: {
        asset_id: assetId,
        status: { $in: PLACEHOLDER_STATUSES },
        mux_id: { $null: true },
        ...(kind === 'job' ? { is_directive_run: false } : {}),
      },
    })) as RobotsJobRow[];

    if (waiting.length > 0) {
      throw new RobotsRequestError(
        409,
        'create-pending',
        "Mux hasn't confirmed an earlier run on this video yet. Wait for it, or tell the plugin nothing is running."
      );
    }

    return (await robotJobs().create({
      data: {
        ...data,
        mux_id: null,
        is_directive_run: kind === 'run',
        status: 'requested',
        asset_id: assetId,
        request_id: newRequestId(),
        requested_at: new Date().toISOString(),
      },
    })) as RobotsJobRow;
  });
}

/**
 * Mux created the job or run: the placeholder becomes its row. A webhook may have got there first,
 * either claiming this placeholder (fine) or storing the job on its own row (keep that one and drop
 * the placeholder). If the placeholder was dismissed meanwhile, the job is stored anyway.
 *
 * Mux's answer is the only sure link between a request and its job, so if a webhook gave the
 * placeholder to another job of the same workflow, the request is taken back from that row.
 */
async function settlePlaceholder(placeholderId: number, incoming: IncomingRow): Promise<RobotsJobRow> {
  const placeholder = await findRowById(placeholderId);
  const existing = await findRowByMuxId(incoming.mux_id);
  const request = {
    request_id: placeholder?.request_id ?? undefined,
    requested_by: placeholder?.requested_by ?? undefined,
    requested_at: placeholder?.requested_at ?? undefined,
  };
  const claimedByAnother = !!placeholder?.mux_id && placeholder.mux_id !== incoming.mux_id;

  if (claimedByAnother) {
    await robotJobs().update({
      where: { id: placeholderId },
      data: { request_id: null, requested_by: null, requested_at: null },
    });
  }

  if (existing && existing.id !== placeholderId) {
    if (placeholder && !placeholder.mux_id) await robotJobs().delete({ where: { id: placeholderId } });

    const update = mergeIntoRow(existing, { ...incoming, ...request });

    return update
      ? ((await robotJobs().update({ where: { id: existing.id }, data: update })) as RobotsJobRow)
      : existing;
  }

  if (placeholder && !claimedByAnother) {
    const update = mergeIntoRow(placeholder, incoming) ?? {};

    return (await robotJobs().update({
      where: { id: placeholderId },
      data: { ...update, mux_id: incoming.mux_id },
    })) as RobotsJobRow;
  }

  return upsertRobotsRow({ ...incoming, ...request });
}

/** Mux didn't answer, so the create may or may not have happened, unless a webhook settled it meanwhile. */
async function markUnconfirmed(placeholderId: number): Promise<RobotsRowResponse | null> {
  const placeholder = await findRowById(placeholderId);
  if (!placeholder) return null;
  if (placeholder.mux_id) return { row: placeholder };

  const row = (await robotJobs().update({
    where: { id: placeholderId },
    data: { status: 'unconfirmed' },
  })) as RobotsJobRow;

  return { row, unconfirmed: true };
}

/**
 * Calls Mux once for a create guarded by `placeholder`. Nothing is retried: there's no idempotency
 * key, and a second create is a second billed run.
 */
async function createOnce(
  assetId: string,
  placeholder: RobotsJobRow,
  kind: 'job' | 'run',
  create: () => Promise<IncomingRow>
): Promise<RobotsRowResponse> {
  let incoming: IncomingRow;

  try {
    incoming = await create();
  } catch (error) {
    const classified = classifyMuxError(error, kind);

    if (classified.reason === 'unconfirmed') {
      const result = await withAssetLock(assetId, () => markUnconfirmed(placeholder.id));
      if (result) return result;
      throw new RobotsRequestError(400, 'unconfirmed', classified.message);
    }

    // Mux answered, so nothing started.
    await withAssetLock(assetId, () => robotJobs().delete({ where: { id: placeholder.id, mux_id: { $null: true } } }));
    throw RobotsRequestError.fromMux(classified);
  }

  return { row: await withAssetLock(assetId, () => settlePlaceholder(placeholder.id, incoming)) };
}

const robotsService = () => ({
  listRows,

  /**
   * The one Mux read when the Robots tab opens: capability, and jobs missing here. Also writes stored
   * results the video doesn't show yet, whether or not Mux answers.
   *
   * Robots v1 lists the jobs of both versions, each linked to its own version's route: that link is
   * how rows stored before 4.0 learn their version.
   */
  async syncAsset(muxAsset: MuxAsset): Promise<RobotsSyncResponse> {
    const assetId = muxAsset.asset_id;
    if (!assetId) return { capability: 'ok', rows: [] };

    let jobs: MuxJobLike[];

    try {
      const { robots } = await getMuxClient();
      jobs = ((await robots.jobs.list({ asset_id: assetId, limit: MAX_ROWS })).data ?? []) as MuxJobLike[];
    } catch (error) {
      const classified = classifyMuxError(error);
      await withAssetLock(assetId, () => backfillOutputs(assetId));
      const rows = await listRows(assetId);

      if (classified.reason === 'scope-missing' || classified.reason === 'not-enabled') {
        return {
          capability: classified.reason,
          ...(classified.termsUrl ? { termsUrl: classified.termsUrl } : {}),
          rows,
        };
      }

      return { capability: 'ok', rows, error: { reason: classified.reason, message: classified.message } };
    }

    await withAssetLock(assetId, async () => {
      for (const job of jobs) {
        const definition = workflowByKey(job.workflow);
        if (!definition || typeof job.id !== 'string') continue;

        await upsertRobotsRow(rowFromJob(job, { workflow: definition.key, assetId, detail: false }), {
          assetId,
          workflow: definition.key,
          at: job.created_at,
        });
      }

      await backfillOutputs(assetId);
    });

    return { capability: 'ok', rows: await listRows(assetId) };
  },

  /** `values` are the run form's values, checked against the catalog. */
  async createJob({
    userId,
    muxAsset,
    workflow,
    values,
  }: {
    userId: number | null;
    muxAsset: MuxAsset;
    workflow: unknown;
    values: unknown;
  }): Promise<RobotsRowResponse> {
    const definition = workflowByKey(workflow);
    if (!definition) throw new RobotsRequestError(400, 'invalid-parameters', 'Unknown Robots workflow.');
    if (!isRunnableWorkflow(definition)) {
      throw new RobotsRequestError(
        400,
        'invalid-parameters',
        definition.legacy
          ? `${definition.label} isn't in Robots v1. Run Analyze structure instead.`
          : `${definition.label} can't be run from Strapi.`
      );
    }

    const assetId = requireReadyAsset(muxAsset);

    const parsed = robotsValuesSchema(definition).safeParse(values ?? {});
    if (!parsed.success) {
      throw new RobotsRequestError(
        400,
        'invalid-parameters',
        parsed.error.issues.map((issue) => `${issue.path.join('.') || 'values'}: ${issue.message}`).join(' ')
      );
    }

    const context = assetContextFrom(muxAsset.asset_data as any);
    const unavailable = workflowUnavailableReason(definition, context);
    if (unavailable) throw new RobotsRequestError(400, 'invalid-parameters', `${definition.label} ${unavailable}.`);

    const errors = validateParams(definition, parsed.data, context);
    if (errors.length > 0) throw new RobotsRequestError(400, 'invalid-parameters', errors.join(' '));

    const parameters = paramsFromFormValues(definition, assetId, parsed.data, context);

    const placeholder = await insertPlaceholder(assetId, 'job', {
      api_version: CREATE_VERSION,
      workflow: definition.key,
      parameters,
      requested_by: userId,
    });

    return createOnce(assetId, placeholder, 'job', async () => {
      const job = await workflowJobs(await getMuxClient(), CREATE_VERSION, definition).create({
        parameters,
        passthrough: ROBOTS_PASSTHROUGH,
      });

      return rowFromJob(job as MuxJobLike, {
        workflow: definition.key,
        assetId,
        detail: true,
        apiVersion: CREATE_VERSION,
      });
    });
  },

  async runDirective({
    userId,
    muxAsset,
    directiveId,
  }: {
    userId: number | null;
    muxAsset: MuxAsset;
    directiveId: unknown;
  }): Promise<RobotsRowResponse> {
    if (typeof directiveId !== 'string' || !MUX_ID.test(directiveId)) {
      throw new RobotsRequestError(400, 'invalid-parameters', 'Choose a directive to run.');
    }

    const assetId = requireReadyAsset(muxAsset);
    const placeholder = await insertPlaceholder(assetId, 'run', {
      api_version: CREATE_VERSION,
      directive_id: directiveId,
      requested_by: userId,
    });

    return createOnce(assetId, placeholder, 'run', async () => {
      const { robots } = await getMuxClient();
      const run = await robots.directives.runs.create(directiveId, { asset_id: assetId });
      const row = rowFromRun(run, { directiveId, assetId, apiVersion: CREATE_VERSION });

      if (!row) throw new Error('Mux answered without naming the run it started.');

      return row;
    });
  },

  async cancelJob(row: RobotsJobRow): Promise<RobotsJobRow> {
    const { mux_id: muxId } = row;
    const definition = workflowByKey(row.workflow);
    if (row.is_directive_run || !muxId || !definition) {
      throw new RobotsRequestError(400, 'invalid-parameters', 'Only a job Mux has started can be cancelled.');
    }
    if (isTerminalRow(row)) return row;

    const { result: job, version } = await onJobVersion(row, definition, (client, apiVersion) =>
      apiVersion === 'v1' ? client.robots.jobs.cancel(muxId) : client.robotsV0.jobs.cancel(muxId)
    );

    return withAssetLock(row.asset_id, () =>
      upsertRobotsRow(
        rowFromJob(job as MuxJobLike, {
          workflow: definition.key,
          assetId: row.asset_id,
          detail: false,
          apiVersion: version,
        })
      )
    );
  },

  /**
   * Reads a finished job's outputs and units from Mux, once, for a row that only has the list
   * summary. Webhooks normally store them; this covers jobs that finished before the asset was here.
   */
  async loadJobDetail(row: RobotsJobRow): Promise<RobotsJobRow> {
    const definition = workflowByKey(row.workflow);
    const muxId = row.mux_id;
    if (row.is_directive_run || !muxId || row.detail_loaded || !isTerminalRow(row) || !definition) return row;

    const { result, version } = await onJobVersion(row, definition, (client, apiVersion) =>
      workflowJobs(client, apiVersion, definition).retrieve(muxId)
    );
    const job = result as MuxJobLike;

    return withAssetLock(row.asset_id, async () => {
      const stored = await upsertRobotsRow(
        rowFromJob(job, { workflow: definition.key, assetId: row.asset_id, detail: true, apiVersion: version })
      );

      if (stored.asset_id) await writeOutputs(stored.asset_id, definition.key, job);

      return stored;
    });
  },

  /**
   * Robots v1 lists the directives of both versions, each linked to its own version's route.
   * `complete` is false when there may be more directives than one listing returns. `timeoutMs`
   * replaces the client's 60 s for callers that can't wait that long.
   */
  async listDirectives({ timeoutMs }: { timeoutMs?: number } = {}): Promise<{
    directives: RobotsDirectiveSummary[];
    complete: boolean;
  }> {
    return callMux(async () => {
      const { robots } = await getMuxClient();
      const listed =
        (await robots.directives.list({ limit: DIRECTIVES_PAGE_SIZE }, timeoutMs ? { timeout: timeoutMs } : undefined))
          .data ?? [];

      return {
        directives: listed.map((directive) => {
          const apiVersion = apiVersionFromHref(directive._links?.self?.href);
          return {
            id: directive.id,
            name: directive.name || directive.id,
            ...(apiVersion ? { api_version: apiVersion } : {}),
          };
        }),
        complete: listed.length < DIRECTIVES_PAGE_SIZE,
      };
    });
  },

  /** Drops a placeholder Mux never confirmed, once the person says nothing is running. */
  async dismissPending(row: RobotsJobRow): Promise<void> {
    await withAssetLock(row.asset_id, async () => {
      await robotJobs().delete({
        where: { id: row.id, mux_id: { $null: true }, status: { $in: PLACEHOLDER_STATUSES } },
      });
    });
  },
});

export default robotsService;

export type RobotsService = ReturnType<typeof robotsService>;
