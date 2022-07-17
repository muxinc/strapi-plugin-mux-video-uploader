import { Context } from 'koa';
import { MuxAsset, MuxPlaybackPolicy } from '../../types';
import { getService } from '../utils';

import pluginId from './../../admin/src/pluginId';

const model = `plugin::${pluginId}.mux-asset`;

const search = (ctx: Context) => {
  const params = ctx.query;

  if (!params.sort) {
    params.sort = 'createdAt';
  }

  if (!params.order) {
    params.order = 'desc';
  }

  return strapi.entityService.findMany(model, params);
};

const find = async (ctx: Context) => {
  const entities = await search(ctx);
  const totalCount = await count(ctx);

  const items = entities.map((entity: any) => entity);

  return { items, totalCount };
};

const findOne = async (ctx: Context) => {
  const { id } = ctx.params;

  return await strapi.entityService.findOne(model, id, ctx.query);
};

const count = (ctx: Context) => {
  const params = ctx.query;

  return strapi.entityService.count(model, params);
};

const create = async (ctx: Context) => {
  const { body } = ctx.request;

  return await strapi.entityService.create(model, { data: body });
};

const createBulk = async (ctx: Context) => {
  let titles = ctx.request.body.titles;
  if (typeof titles === 'string') {
    titles = [titles];
  }

  const existing = await strapi.entityService.findMany(model, {
    filters: {
      title: { $in: titles },
    },
  });

  const existingTitles = existing.map((asset: MuxAsset) => asset.title);
  const titlesNotInDb = titles.filter(
    (title: string) => !existingTitles.includes(title)
  );

  if (titlesNotInDb.length > 0) {
    const entities = await strapi.db.query(model).createMany({
      data: titlesNotInDb.map((title: string) => ({ title })),
    });

    return entities;
  } else {
    return [];
  }
};

const update = async (ctx: Context) => {
  const { id } = ctx.params;
  const { body } = ctx.request;

  const data: {
    title?: string;
    isReady?: boolean;
    playback_id?: string;
    playback_policy?: MuxPlaybackPolicy;
  } = {};

  if (body.title !== undefined) {
    data.title = body.title;
  }
  if (body.isReady !== undefined) {
    data.isReady = body.isReady;
  }
  if (body.playbackPolicy !== undefined) {
    const muxAsset = await strapi.entityService.findOne(model, id);
    const policyUpdate = await getService('mux').updatePlaybackPolicy(
      muxAsset,
      body.playbackPolicy
    );

    data.playback_id = policyUpdate.id;
    data.playback_policy = policyUpdate.policy;
  }

  return await strapi.entityService.update(model, id, { data });
};

const del = async (ctx: Context) => {
  const { id } = ctx.params;

  return await strapi.entityService.delete(model, id);
};

export = {
  find,
  findOne,
  count,
  create,
  update,
  del,
};
