import { Context } from 'koa';

import { MuxAssetUpdate } from '../content-types/mux-asset/types';
import { resolveMuxAsset } from '../utils/resolve-mux-asset';
import { updateTextTracks } from '../utils/text-tracks';
import { ASSET_MODEL } from '../utils/types';

const search = (ctx: Context) => {
  const params = ctx.query;

  if (!params.sort) {
    params.sort = 'createdAt';
  }

  if (!params.order) {
    params.order = 'desc';
  }

  return strapi.entityService.findMany(ASSET_MODEL, params);
};

const find = async (ctx: Context) => {
  const entities = await search(ctx);
  const totalCount = await count(ctx);

  const items = entities.map((entity: any) => entity);

  return { items, totalCount };
};

const findOne = async (ctx: Context) => {
  const { id } = ctx.params;

  return await strapi.entityService.findOne(ASSET_MODEL, id, ctx.query);
};

const count = (ctx: Context) => {
  const params = ctx.query;

  return strapi.entityService.count(ASSET_MODEL, params);
};

const create = async (ctx: Context) => {
  const { body } = ctx.request.body;

  return await strapi.entityService.create(ASSET_MODEL, { data: body });
};

const update = async (ctx: Context) => {
  const { id } = ctx.params;
  const muxAsset = await resolveMuxAsset({ id });

  const { title, custom_text_tracks } = <MuxAssetUpdate>ctx.request.body;

  /** Let Mux's webhook handlers notify us of track changes */
  await updateTextTracks(muxAsset, custom_text_tracks);

  return await strapi.entityService.update(ASSET_MODEL, id, {
    data: { title },
  });
};

const del = async (ctx: Context) => {
  const { id } = ctx.params;

  return await strapi.entityService.delete(ASSET_MODEL, id);
};

export = {
  find,
  findOne,
  count,
  create,
  update,
  del,
};
