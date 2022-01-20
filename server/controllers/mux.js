const Mux = require('@mux/mux-node');

const { getService, Config } = require('../utils');
const pluginId = require('./../../admin/src/pluginId');

const { Webhooks } = Mux;

const model = `plugin::${pluginId}.mux-asset`;

const index = async (ctx) => ctx.send({ message: 'ok' });

const submitDirectUpload = async (ctx) => {
  const data = ctx.request.body;

  const result = await getService('mux').getDirectUploadUrl(ctx.request.header.origin);

  data.upload_id = result.id;

  await strapi.entityService.create(model, { data });

  ctx.send(result);
};

const submitRemoteUpload = async (ctx) => {
  const data = ctx.request.body;

  if(!data.url) {
    ctx.badRequest("ValidationError", { errors: { "url": ["url cannot be empty"]}});
    
    return;
  }

  const result = await getService('mux').createAsset(data.url);

  data.asset_id = result.id;

  const response = await strapi.entityService.create({ data }, { model });

  ctx.send(response);
};

const deleteMuxAsset = async (ctx) => {
  const data = ctx.request.body;

  if(!data.upload_id) {
    ctx.badRequest("ValidationError", { errors: { "upload_id": ["upload_id needs to be defined"]}});

    return;
  }

  strapi.entityService.delete(model, data.id);

  const result = { success: true, deletedOnMux: false };

  if(data.delete_on_mux === "true") {
    const assetId = data.asset_id !== '' ? data.asset_id : await getService('mux').getAssetIdByUploadId(data.upload_id);

    const deletedOnMux = await getService('mux').deleteAsset(assetId);

    result.deletedOnMux = deletedOnMux;
  }

  ctx.send(result);
};

const muxWebhookHandler = async (ctx) => {
  const body = ctx.request.body;
  const sigHttpHeader = ctx.request.headers['mux-signature'];

  const config = await Config.getConfig('general');

  if(sigHttpHeader === undefined || sigHttpHeader === '' || (Array.isArray(sigHttpHeader) && sigHttpHeader.length < 0)) {
    ctx.throw(401, 'Webhook signature is missing');
  }
  
  if(Array.isArray(sigHttpHeader) && sigHttpHeader.length > 1) {
    ctx.throw(401, 'we have an unexpected amount of signatures');
  }

  let sig;

  if(Array.isArray(sigHttpHeader)){
    sig = sigHttpHeader[0];
  }
  else{
    sig = sigHttpHeader;
  }

  // TODO: Currently commented out because we should be using the raw request body for verfiying
  // Webhook signatures, NOT JSON.stringify.  Strapi does not currently allow for access to the
  // Koa.js request (the middleware used for parsing requests).

  // let isSigValid;
  
  // try {
  //   isSigValid = Webhooks.verifyHeader(JSON.stringify(body), sig, config.webhook_signing_secret);
  // } catch(err) {
  //   ctx.throw(403, err);

  //   return;
  // }

  const { type, data } = body;

  let payload;

  if(type === 'video.upload.asset_created') {
    payload = {
      params: { upload_id: data.id },
      data: { asset_id: data.asset_id }
    };
  } else if(type === 'video.asset.ready') {
    payload = {
      params: { asset_id: body.data.id },
      data: {
        playback_id: data.playback_ids[0].id,
        isReady: true
      }
    };
  } else if(type === 'video.asset.errored') {
    payload = {
      params: { upload_id: data.upload_id },
      data: {
        asset_id: data.id,
        error_message: `${data.errors.type}: ${data.errors.messages[0] || ''}`
      }
    };
  } else {
    ctx.send('ignored');

    return;
  }

  // const result = await strapi.entityService.update(payload, { model });
  const result = await strapi.entityService.update(model, data.id);

  ctx.send(result);
};

module.exports = {
  index,
  submitDirectUpload,
  submitRemoteUpload,
  deleteMuxAsset,
  muxWebhookHandler
};
