import { parseMultipartData } from '@strapi/utils';
import { Context } from 'koa';

import pluginId from './../../admin/src/pluginId';

const model = `plugin::${pluginId}.mux-asset`;

const search = (ctx: Context) => {
  const { start, limit, sort = 'createdAt', order = 'desc' } = ctx.query;

  const params:any = {
    start,
    limit,
    sort: [{ [sort as string]: order }]
  };

  if (ctx.query.filter) {
    const [filter, ...rest] = (ctx.query.filter as string).split(':');

    params.filters = { [filter]: { '$containsi': rest.join(':') } };
  }

  return strapi.entityService.findMany(model, params);
}

const index = async (ctx:Context) => {
  ctx.send({
    message: 'ok'
  });
};

const find = async (ctx: Context) => {
  const entities = await search(ctx);
  const totalCount = await count(ctx);

  const items = entities.map((entity:any) => entity);

  return {
    items,
    totalCount
  };
};

const findOne = async (ctx:Context) => {
  const { id } = ctx.params;
  
  return await strapi.entityService.findOne({ id }, { model });
};

const count = (ctx: Context) => {
  const params:any = {};

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
    entity = await strapi.entityService.create({ data: ctx.request.body }, { model });
  }

  return entity;
};

const update = async (ctx:Context) => {
  const { id } = ctx.params;

  const { data: body } = parseMultipartData(ctx);

  const data: { title?: string, isReady?: boolean } = {};
  
  if (body.title !== undefined) {
    data.title = body.title;
  }
  if (body.isReady !== undefined) {
    data.isReady = body.isReady;
  }
  
  return await strapi.entityService.update(model, id, { data });
};

const del = async (ctx:Context) => {
  const { id } = ctx.params;

  return await strapi.entityService.delete({ params: { id } }, { model });
};

export = {
  index,
  find,
  findOne,
  count,
  create,
  update,
  del
}
