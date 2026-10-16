import { Context } from 'koa';
import { z } from 'zod';

import { RobotsCreateJobBody, RobotsJobRow, RobotsRunDirectiveBody } from '../../../types/robots';
import { muxAssetRelationFields } from '../../../types/robots-format';
import { MuxAsset } from '../content-types/mux-asset/types';
import { RobotsRequestError } from '../robots/errors';
import { Config, getService } from '../utils';
import { parseRequest } from '../utils/parse-json-body';
import { resolveMuxAssetOrNull } from '../utils/resolve-mux-asset';
import { ASSET_MODEL, ROBOT_JOB_MODEL } from '../utils/types';
import { nonEmptyString } from '../utils/values';

const findById = async <T>(model: string, value: unknown): Promise<T | null> => {
  const id = Number(value);
  return Number.isInteger(id) ? ((await strapi.db.query(model as any).findOne({ where: { id } })) as T | null) : null;
};

/** The mux-asset named by `:asset`, or `null` once a 404 has been sent. */
export async function findMuxAsset(ctx: Context): Promise<MuxAsset | null> {
  const muxAsset = await findById<MuxAsset>(ASSET_MODEL, ctx.params.asset);
  if (!muxAsset) ctx.notFound('mux-asset.notFound');
  return muxAsset;
}

/**
 * The job or run named by `:id`, or `null` once a 404 has been sent. Rows are stored for every asset in
 * the Mux environment, but only those on this Strapi's videos can be read, cancelled or dismissed.
 */
async function findJobRow(ctx: Context): Promise<RobotsJobRow | null> {
  const row = await findById<RobotsJobRow>(ROBOT_JOB_MODEL, ctx.params.id);
  const onOurVideo = !!row?.asset_id && !!(await resolveMuxAssetOrNull({ asset_id: row.asset_id }));

  if (!row || !onOurVideo) {
    ctx.notFound('mux-robot-job.notFound');
    return null;
  }
  return row;
}

/** A parsed body, or `undefined` once `parseRequest` has answered 400. */
export function parseBody<S extends z.ZodTypeAny>(ctx: Context, schema: S): z.infer<S> | undefined {
  try {
    return parseRequest(ctx, schema, null, null).body;
  } catch {
    return undefined;
  }
}

/** Answers a `RobotsRequestError` with its status and `{ error }` body. Anything else propagates. */
export const withRobotsErrors =
  (handler: (ctx: Context) => Promise<void>) =>
  async (ctx: Context): Promise<void> => {
    try {
      await handler(ctx);
    } catch (error) {
      if (!(error instanceof RobotsRequestError)) throw error;

      ctx.status = error.status;
      ctx.body = {
        error: {
          reason: error.reason,
          message: error.message,
          ...(error.termsUrl ? { termsUrl: error.termsUrl } : {}),
        },
      };
    }
  };

const userId = (ctx: Context) => (typeof ctx.state?.user?.id === 'number' ? ctx.state.user.id : null);

export default {
  /**
   * The Mux videos an entry links to, with their newest summary, for the Content Manager's summary
   * panel. Needs Content Manager read access to the entry, not the plugin's permissions.
   */
  entryVideos: async (ctx: Context) => {
    const model = nonEmptyString(ctx.query.model);
    const documentId = nonEmptyString(ctx.query.documentId);
    const locale = nonEmptyString(ctx.query.locale);

    const contentType = model ? strapi.contentType(model as any) : undefined;
    if (!model || !documentId || !contentType) {
      ctx.badRequest('ValidationError', { errors: { query: 'model and documentId are required' } });
      return;
    }

    const permissionChecker = strapi
      .plugin('content-manager')
      .service('permission-checker')
      .create({ userAbility: ctx.state.userAbility, model });

    if (permissionChecker.cannot.read()) {
      ctx.forbidden();
      return;
    }

    // Only the Mux relations this role may read are loaded at all.
    const fieldNames = muxAssetRelationFields(contentType.attributes).filter((name) =>
      permissionChecker.can.read(null, name)
    );
    if (fieldNames.length === 0) {
      ctx.send({ fields: [] });
      return;
    }

    const entry = await strapi.documents(model as any).findOne({
      documentId,
      ...(locale ? { locale } : {}),
      status: 'draft',
      // `createdBy` lets "is creator" conditions apply, as in the Content Manager's own read.
      populate: { ...Object.fromEntries(fieldNames.map((name) => [name, true])), createdBy: { fields: ['id'] } },
    } as any);

    if (entry && permissionChecker.cannot.read(entry)) {
      ctx.forbidden();
      return;
    }

    // Field permissions can have conditions on the entry, so they're checked again against it.
    const readableFields = fieldNames.filter((name) => !permissionChecker.cannot.read(entry ?? undefined, name));

    const fields = readableFields.map((name) => {
      const related = (entry as Record<string, any> | null)?.[name];
      const videos = (Array.isArray(related) ? related : related ? [related] : []) as MuxAsset[];

      return {
        name,
        videos: videos.map((video) => ({
          id: video.id,
          title: video.title,
          asset_id: video.asset_id,
          summary: video.robots_outputs?.summarize ?? null,
        })),
      };
    });

    ctx.send({ fields });
  },

  /** Polled while something runs, so it never calls Mux. */
  listJobs: withRobotsErrors(async (ctx) => {
    const muxAsset = await findMuxAsset(ctx);
    if (!muxAsset) return;

    ctx.send({ rows: muxAsset.asset_id ? await getService('robots').listRows(muxAsset.asset_id) : [] });
  }),

  sync: withRobotsErrors(async (ctx) => {
    const muxAsset = await findMuxAsset(ctx);
    if (!muxAsset) return;

    ctx.send(await getService('robots').syncAsset(muxAsset));
  }),

  createJob: withRobotsErrors(async (ctx) => {
    const muxAsset = await findMuxAsset(ctx);
    const body = muxAsset && parseBody(ctx, RobotsCreateJobBody);
    if (!muxAsset || !body) return;

    const result = await getService('robots').createJob({
      userId: userId(ctx),
      muxAsset,
      workflow: body.workflow,
      values: body.values,
    });

    ctx.send(result, result.unconfirmed ? 202 : 200);
  }),

  runDirective: withRobotsErrors(async (ctx) => {
    const muxAsset = await findMuxAsset(ctx);
    const body = muxAsset && parseBody(ctx, RobotsRunDirectiveBody);
    if (!muxAsset || !body) return;

    const result = await getService('robots').runDirective({
      userId: userId(ctx),
      muxAsset,
      directiveId: body.directive_id,
    });

    ctx.send(result, result.unconfirmed ? 202 : 200);
  }),

  cancelJob: withRobotsErrors(async (ctx) => {
    const row = await findJobRow(ctx);
    if (!row) return;

    ctx.send({ row: await getService('robots').cancelJob(row) });
  }),

  /** `?load=1` reads a finished job's outputs and units from Mux when they aren't stored. */
  findJob: withRobotsErrors(async (ctx) => {
    const row = await findJobRow(ctx);
    if (!row) return;

    const load = ctx.query.load === '1' || ctx.query.load === 'true';

    ctx.send({ row: load ? await getService('robots').loadJobDetail(row) : row });
  }),

  dismissPending: withRobotsErrors(async (ctx) => {
    const row = await findJobRow(ctx);
    if (!row) return;

    await getService('robots').dismissPending(row);
    ctx.status = 204;
  }),

  /** When Mux can't be read, the configured ids still come back with the reason: uploads attach them as they are. */
  listDirectives: withRobotsErrors(async (ctx) => {
    const { defaultDirectiveIds = [] } = await Config.getConfig();

    try {
      const { directives, complete } = await getService('robots').listDirectives();
      ctx.send({ directives, complete, defaultDirectiveIds });
    } catch (error) {
      if (!(error instanceof RobotsRequestError)) throw error;
      ctx.send({
        directives: [],
        complete: false,
        defaultDirectiveIds,
        error: { reason: error.reason, message: error.message },
      });
    }
  }),
};
