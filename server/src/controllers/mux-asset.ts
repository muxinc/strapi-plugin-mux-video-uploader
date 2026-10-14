import { Context } from 'koa';
import { z } from 'zod';

import { MuxAssetUpdate } from '../content-types/mux-asset/types';
import { callMux } from '../robots/errors';
import { getService } from '../utils';
import { getMuxAssetQuery, getPagination, MuxAssetQuery, sanitizeMuxAssetOutput } from '../utils/mux-asset-query';
import { resolveMuxAsset } from '../utils/resolve-mux-asset';
import { updateTextTracks } from '../utils/text-tracks';
import { ASSET_MODEL } from '../utils/types';
import { compact } from '../utils/values';
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

/** Each is left as it is when absent from the request. */
const MuxAssetDetailsBody = z.object({
  description: z.string().nullable().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
});

const update = async (ctx: Context) => {
  const { documentId } = ctx.params;
  const details = parseBody(ctx, MuxAssetDetailsBody);
  if (!details) return;

  const muxAsset = await resolveMuxAsset({ id: documentId });

  const { title, custom_text_tracks, known_track_ids } = <MuxAssetUpdate>ctx.request.body;

  /** Let Mux's webhook handlers notify us of track changes */
  await updateTextTracks(
    muxAsset,
    custom_text_tracks,
    Array.isArray(known_track_ids) ? known_track_ids.filter((id) => typeof id === 'string') : []
  );

  const data = compact({
    title: typeof title === 'string' && title ? title : undefined,
    description: details.description === undefined ? undefined : details.description?.trim() || null,
    tags: details.tags,
  });

  if (Object.keys(data).length > 0) {
    await strapi.db.query(ASSET_MODEL).update({ where: { id: documentId }, data });
  }

  return { ok: true };
};

const del = async (ctx: Context) => {
  const { documentId } = ctx.params;

  return await strapi.documents(ASSET_MODEL).delete(documentId);
};

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
  createPlaybackId,
};
