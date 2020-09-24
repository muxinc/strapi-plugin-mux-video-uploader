const { sanitizeEntity, parseMultipartData } = require('strapi-utils');

module.exports = {

  index: async (ctx) => {
    ctx.send({
      message: 'ok'
    });
  },

  find: async (ctx) => {
    let entities;

    if (ctx.query._q) {
      entities = await strapi.entityService.search({params: ctx.query}, {model: 'plugins::mux.mux-asset'});
    } else {
      entities = await strapi.entityService.find({params: ctx.query}, {model: 'plugins::mux.mux-asset'});
    }

    return entities.map(entity => sanitizeEntity(entity, {model: { options: {}, attributes:[]}}));
  },

  findOne: async (ctx) => {
    const { id } = ctx.params;

    const entity = await strapi.entityService.findOne({ id }, {model: 'plugins::mux.mux-asset'});

    return sanitizeEntity(entity, {model: { options: {}, attributes:[]}});
  },

  count: (ctx) => {
    if (ctx.query._q) {
      return strapi.entityService.countSearch({params: ctx.query}, {model: 'plugins::mux.mux-asset'});
    }
    return strapi.entityService.count({params: ctx.query}, {model: 'plugins::mux.mux-asset'});
  },

  create: async (ctx) => {
    let entity;
    
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);

      entity = await strapi.entityService.create({ data, files }, {model: 'plugins::mux.mux-asset'});
    } else {
      entity = await strapi.entityService.create({ data: ctx.request.body }, {model: 'plugins::mux.mux-asset'});
    }

    return sanitizeEntity(entity, {model: { options: {}, attributes:[]}});
  },

  update: async (ctx) => {
    const { id } = ctx.params;

    let entity;

    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);

      entity = await strapi.entityService.update({ params: { id }, data, files }, {model: 'plugins::mux.mux-asset'});
    } else {
      entity = await strapi.entityService.update({ params: { id }, data: ctx.request.body }, {model: 'plugins::mux.mux-asset'});
    }

    return sanitizeEntity(entity, {model: { options: {}, attributes:[]}});
  },

  delete: async (ctx) => {
    const { id } = ctx.params;

    const entity = await strapi.entityService.delete({ params: { id } }, {model: 'plugins::mux.mux-asset'});

    return sanitizeEntity(entity, {model: { options: {}, attributes:[]}});
  },
};
