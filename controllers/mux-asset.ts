// @ts-ignore
import { sanitizeEntity, parseMultipartData } from 'strapi-utils';
import { Context } from 'koa';

const index = async (ctx:Context) => {
  ctx.send({
    message: 'ok'
  });
};

const find = async (ctx:Context) => {
  let entities;

  if (ctx.query._q) {
    entities = await strapi.entityService.search({params: ctx.query}, {model: 'plugins::mux.mux-asset'});
  } else {
    entities = await strapi.entityService.find({params: ctx.query}, {model: 'plugins::mux.mux-asset'});
  }

  return entities.map((entity:any) => sanitizeEntity(entity, {model: { options: {}, attributes:[]}}));
};

const findOne = async (ctx:Context) => {
  const { id } = ctx.params;

  const entity = await strapi.entityService.findOne({ id }, {model: 'plugins::mux.mux-asset'});

  return sanitizeEntity(entity, {model: { options: {}, attributes:[]}});
};

const count = (ctx:Context) => {
  if (ctx.query._q) {
    return strapi.entityService.countSearch({params: ctx.query}, {model: 'plugins::mux.mux-asset'});
  }
  
  return strapi.entityService.count({params: ctx.query}, {model: 'plugins::mux.mux-asset'});
};

const create = async (ctx:Context) => {
  let entity;
  
  if (ctx.is('multipart')) {
    const { data, files } = parseMultipartData(ctx);

    entity = await strapi.entityService.create({ data, files }, {model: 'plugins::mux.mux-asset'});
  } else {
    entity = await strapi.entityService.create({ data: ctx.request.body }, {model: 'plugins::mux.mux-asset'});
  }

  return sanitizeEntity(entity, {model: { options: {}, attributes:[]}});
};

const update = async (ctx:Context) => {
  const { id } = ctx.params;

  let entity;

  if (ctx.is('multipart')) {
    const { data, files } = parseMultipartData(ctx);

    entity = await strapi.entityService.update({ params: { id }, data, files }, {model: 'plugins::mux.mux-asset'});
  } else {
    entity = await strapi.entityService.update({ params: { id }, data: ctx.request.body }, {model: 'plugins::mux.mux-asset'});
  }

  return sanitizeEntity(entity, {model: { options: {}, attributes:[]}});
};

const del = async (ctx:Context) => {
  const { id } = ctx.params;

  const entity = await strapi.entityService.delete({ params: { id } }, {model: 'plugins::mux.mux-asset'});

  return sanitizeEntity(entity, {model: { options: {}, attributes:[]}});
};

export {
  index,
  find,
  findOne,
  create,
  update,
  del
}
