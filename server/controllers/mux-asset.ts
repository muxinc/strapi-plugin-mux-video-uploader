import { parseMultipartData } from '@strapi/utils';
import { Context } from 'koa';
import { MuxAsset, MuxPlaybackPolicy } from '../../types';
import { getService } from '../utils';

import pluginId from './../../admin/src/pluginId';

const model = `plugin::${pluginId}.mux-asset`;

const search = (ctx: Context) => {
  const { start, sort = 'createdAt', order = 'desc' } = ctx.query;

  const params: any = {
    start,
    sort: [{ [sort as string]: order }],
  };

  if (ctx.query.limit) {
    params.limit = ctx.query.limit;
  }

  if (ctx.query.filter) {
    const [filter, ...rest] = (ctx.query.filter as string).split(':');

    params.filters = { [filter]: { $containsi: rest.join(':') } };
  }

  return strapi.entityService.findMany(model, params);
};

const index = async (ctx: Context) => {
  ctx.send({
    message: 'ok',
  });
};

const find = async (ctx: Context) => {
  const entities = await search(ctx);
  const totalCount = await count(ctx);

  const items = entities.map((entity: any) => entity);

  return {
    items,
    totalCount,
  };
};

const findOne = async (ctx: Context) => {
  const { id } = ctx.params;

  return await strapi.entityService.findOne({ id }, { model });
};

const count = (ctx: Context) => {
  const params: any = {};

  if (ctx.query.filter) {
    const [filter, ...rest] = (ctx.query.filter as string).split(':');

    params.filters = { [filter]: rest.join(':') };
  }

  return strapi.entityService.count(model, params);
};

const create = async (ctx: Context) => {
  let entity;

  if (ctx.is('multipart')) {
    const { data, files } = parseMultipartData(ctx);

    entity = await strapi.entityService.create({ data, files }, { model });
  } else {
    entity = await strapi.entityService.create(
      { data: ctx.request.body },
      { model }
    );
  }

  return entity;
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

  const { data: body } = parseMultipartData(ctx);

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

    data.playback_id = policyUpdate.playbackId;
    data.playback_policy = policyUpdate.playbackPolicy;
  }

  return await strapi.entityService.update(model, id, { data });
};

const del = async (ctx: Context) => {
  const { id } = ctx.params;

  return await strapi.entityService.delete({ params: { id } }, { model });
};

export = { index, find, findOne, count, create, createBulk, update, del };
