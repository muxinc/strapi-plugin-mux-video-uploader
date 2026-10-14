import { Context } from 'koa';

import { RobotsApplyTitleBody, RobotsJobRow } from '../../../types/robots';
import { toAssetTitle } from '../../../types/robots-format';
import { MuxAssetUpdate } from '../content-types/mux-asset/types';
import { callMux, RobotsRequestError } from '../robots/errors';
import { robotJobs } from '../robots/rows';
import { getService } from '../utils';
import { getMuxAssetQuery, getPagination, MuxAssetQuery, sanitizeMuxAssetOutput } from '../utils/mux-asset-query';
import { resolveMuxAsset } from '../utils/resolve-mux-asset';
import { updateTextTracks } from '../utils/text-tracks';
import { ASSET_MODEL } from '../utils/types';
import { snapshotFromAsset } from '../webhooks/asset-snapshot';
import { findMuxAsset, parseBody, withRobotsErrors } from './robots';

/** Leaves out the keys the request didn't set. */
const definedOnly = (params: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined));

const countAssets = ({ filters, _q }: MuxAssetQuery) =>
  strapi.documents(ASSET_MODEL).count(definedOnly({ filters, _q }));

// `find`, `findOne` and `count` serve both the admin and the content API, so `ctx.query` never
// reaches the document service as is: `getMuxAssetQuery` keeps what each API may use.
const find = async (ctx: Context) => {
  const query = await getMuxAssetQuery(ctx);
  const { filters, sort, fields, populate, _q } = query;
  const { start, limit } = getPagination(ctx.query);

  // The admin page also sends `order=desc`, which the document service never applied.
  const entities = await strapi
    .documents(ASSET_MODEL)
    .findMany(definedOnly({ filters, sort: sort || 'createdAt', fields, populate, _q, start, limit }));
  const totalCount = await countAssets(query);

  const items = await sanitizeMuxAssetOutput(ctx, entities);

  return { items, totalCount };
};

const findOne = async (ctx: Context) => {
  const { documentId } = ctx.params;

  // Doesn't read the query, so the row comes back without relations.
  const entity = await strapi.db.query(ASSET_MODEL).findOne({
    where: { id: documentId },
  });
  // @ts-ignore - v5 migration
  // return await strapi.documents(ASSET_MODEL).findOne({
  //   documentId,
  //   filters: ctx.query,
  // });

  return sanitizeMuxAssetOutput(ctx, entity);
};

const count = async (ctx: Context) => countAssets(await getMuxAssetQuery(ctx));

const create = async (ctx: Context) => {
  const { body } = ctx.request.body;

  return await strapi.documents(ASSET_MODEL).create({ data: body });
};

const update = async (ctx: Context) => {
  const { documentId } = ctx.params;
  const muxAsset = await resolveMuxAsset({ id: documentId });

  const { title, custom_text_tracks, known_track_ids } = <MuxAssetUpdate>ctx.request.body;

  /** Let Mux's webhook handlers notify us of track changes */
  await updateTextTracks(
    muxAsset,
    custom_text_tracks,
    Array.isArray(known_track_ids) ? known_track_ids.filter((id) => typeof id === 'string') : []
  );

  if (typeof title === 'string' && title) {
    await strapi.db.query(ASSET_MODEL).update({
      where: { id: documentId },
      data: { title },
    });
    // @ts-ignore - v5 migration
    // await strapi.documents(ASSET_MODEL).update({
    //   documentId,
    //   // @ts-expect-error - v5 migration
    //   data: { title },
    // });
  }

  return { ok: true };
};

const del = async (ctx: Context) => {
  const { documentId } = ctx.params;

  return await strapi.documents(ASSET_MODEL).delete(documentId);
};

/**
 * Sets the title from a completed summarize on this video. The title is read from what's stored, never
 * from the request.
 */
const applyTitle = withRobotsErrors(async (ctx) => {
  const muxAsset = await findMuxAsset(ctx);
  const body = muxAsset && parseBody(ctx, RobotsApplyTitleBody);
  if (!muxAsset || !body) return;

  const job = muxAsset.asset_id
    ? ((await robotJobs().findOne({
        where: { mux_id: body.job_id, asset_id: muxAsset.asset_id, workflow: 'summarize', status: 'completed' },
      })) as RobotsJobRow | null)
    : null;
  const summary = muxAsset.robots_outputs?.summarize;
  const generated = job?.outputs?.title ?? (summary?.job_id === body.job_id ? summary.title : undefined);

  if (!job && summary?.job_id !== body.job_id) {
    throw new RobotsRequestError(404, 'invalid-parameters', 'That summary isn’t stored for this video.');
  }

  const title = toAssetTitle(generated);
  if (!title) {
    throw new RobotsRequestError(400, 'invalid-parameters', 'The generated title is too short to use as a title.');
  }

  const asset = await strapi.db.query(ASSET_MODEL).update({ where: { id: muxAsset.id }, data: { title } });

  ctx.send({ asset });
});

/** Only on request: a moderation job can delete an asset's playback IDs on purpose. */
const createPlaybackId = withRobotsErrors(async (ctx) => {
  const muxAsset = await findMuxAsset(ctx);
  if (!muxAsset) return;

  const assetId = muxAsset.asset_id;
  if (!assetId || muxAsset.playback_id) {
    ctx.send({ asset: muxAsset });
    return;
  }

  await callMux(() => getService('mux').createPlaybackId(assetId, muxAsset.signed ? 'signed' : 'public'));

  // If Mux can't be read now, the playback ID still exists and the next asset webhook brings the rest.
  const fresh = await getService('mux')
    .getAssetById(assetId)
    .catch(() => null);

  const asset = fresh
    ? await strapi.db.query(ASSET_MODEL).update({ where: { id: muxAsset.id }, data: snapshotFromAsset(fresh) })
    : muxAsset;

  ctx.send({ asset });
});

export default {
  find,
  findOne,
  count,
  create,
  update,
  del,
  applyTitle,
  createPlaybackId,
};
