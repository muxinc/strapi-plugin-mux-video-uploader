import axios from 'axios';
import Mux from '@mux/mux-node';
import { Context } from 'koa';

import { getConfig } from '../services/mux';
import pluginId from '../admin/src/pluginId';

const { Webhooks } = Mux;

const model = `plugins::${pluginId}.mux-asset`;

const index = async (ctx:Context) => ctx.send({ message: 'ok' });

const submitDirectUpload = async (ctx:Context) => {
  const data = ctx.request.body;

  const config = await getConfig('general');

  const result = await axios({
    url: 'https://api.mux.com/video/v1/uploads',
    method: "post",
    auth: {
      username: config.access_token,
      password: config.secret_key
    },
    headers: { 'Content-Type': 'application/json' },
    data: { "cors_origin": ctx.request.header.origin, "new_asset_settings": { "playback_policy": ["public"] } }
  });

  const body = result.data.data;

  data.upload_id = body.id;

  await strapi.entityService.create({ data }, { model });

  ctx.send(body);
};

const submitRemoteUpload = async (ctx:Context) => {
  const data = ctx.request.body;

  const config = await getConfig('general');

  const body = { "input": data.url, "playback_policy": ["public"] };

  if(!data.url) {
    ctx.badRequest("ValidationError", { errors: { "url": ["url cannot be empty"]}});
    
    return;
  }

  // @ts-ignore
  const result = await axios({
    url: 'https://api.mux.com/video/v1/assets',
    method: "post",
    validateStatus: false,
    auth: {
      username: config.access_token,
      password: config.secret_key
    },
    headers: { 'Content-Type': 'application/json' },
    data: body
  });

  data.asset_id = result.data.data.id;

  const response = await strapi.entityService.create({ data }, { model });

  ctx.send(response);
};

const muxWebhookHandler = async (ctx:Context) => {
  const body = ctx.request.body;
  const sig = ctx.request.headers['mux-signature'];

  const config = await getConfig('general');

  if(sig === undefined || sig === '') {
    ctx.throw(401, 'Webhook signature is missing');
  }

  let isSigValid;
  
  try {
    isSigValid = Webhooks.verifyHeader(JSON.stringify(body), sig, config.webhook_signing_secret);
  } catch(err) {
    ctx.throw(403, err);

    return;
  }

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
  } else {
    ctx.send('ignored');

    return;
  }

  const result = await strapi.entityService.update(payload, { model });

  ctx.send(result);
};

export {
  index,
  submitDirectUpload,
  submitRemoteUpload,
  muxWebhookHandler
};
