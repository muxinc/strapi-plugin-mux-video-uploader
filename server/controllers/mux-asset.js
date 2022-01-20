const { parseMultipartData } = require('@strapi/utils');

const pluginId = require('./../../admin/src/pluginId');

const model = `plugin::${pluginId}.mux-asset`;

const search = (ctx) => {
  const params = {
    start: ctx.query?.start,
    limit: ctx.query?.limit,
    orderBy: ctx.sort ? { [ctx.sort]: ctx.order || 'asc' } : undefined
  };

  if (ctx.query.filter) {
    const [filter, ...rest] = (ctx.query.filter).split(':');

    params.filters = { [filter]: { '$containsi': rest.join(':') } };
  }

  return strapi.entityService.findMany(model, params);
}

const index = async (ctx) => {
  ctx.send({
    message: 'ok'
  });
};

const find = async (ctx) => {
  const entities = await search(ctx);
  const totalCount = await count(ctx);

  const items = entities.map((entity) => entity);

  return {
    items,
    totalCount
  };
};

const findOne = async (ctx) => {
  const { id } = ctx.params;
  
  return await strapi.entityService.findOne({ id }, { model });
};

const count = (ctx) => {
  const params = {};

  if (ctx.query.filter) {
    const [filter, ...rest] = (ctx.query.filter).split(':');

    params.filters = { [filter]: rest.join(':') };
  }
  
  return strapi.entityService.count(model, params);
};

const create = async (ctx) => {
  let entity;

  if (ctx.is('multipart')) {
    const { data, files } = parseMultipartData(ctx);

    entity = await strapi.entityService.create({ data, files }, { model });
  } else {
    entity = await strapi.entityService.create({ data: ctx.request.body }, { model });
  }

  return entity;
};

const update = async (ctx) => {
  const { id } = ctx.params;

  const { data } = parseMultipartData(ctx);

  const payload = {};
  
  if (data.title !== undefined) {
    payload.title = data.title;
  }
  if (data.isReady !== undefined) {
    payload.isReady = data.isReady;
  }

  console.log(model, id, payload)

  return await strapi.entityService.update(model, id, payload);

//   let entity;
// 
//   if (ctx.is('multipart')) {
//     const { data, files } = parseMultipartData(ctx);
// 
//     entity = await strapi.entityService.update({ params: { id }, data, files }, { model });
//   } else {
//     entity = await strapi.entityService.update({ params: { id }, data: ctx.request.body }, { model });
//   }

  // return entity;
};

const del = async (ctx) => {
  const { id } = ctx.params;

  return await strapi.entityService.delete({ params: { id } }, { model });
};

module.exports = {
  index,
  find,
  findOne,
  count,
  create,
  update,
  del
}
