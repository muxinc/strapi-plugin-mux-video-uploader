import { Context } from 'koa';

import { MuxAssetUpdate } from '../content-types/mux-asset/types';
import { getMuxAssetQuery, getPagination, MuxAssetQuery, sanitizeMuxAssetOutput } from '../utils/mux-asset-query';
import { resolveMuxAsset } from '../utils/resolve-mux-asset';
import { updateTextTracks } from '../utils/text-tracks';
import { ASSET_MODEL } from '../utils/types';

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

export default {
  find,
  findOne,
  count,
  create,
  update,
  del,
};
