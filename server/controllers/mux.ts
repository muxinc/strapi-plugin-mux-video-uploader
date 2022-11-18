import Mux from '@mux/mux-node';
import axios from 'axios';
import { Context } from 'koa';

import { getService, Config } from '../utils';
import pluginId from './../../admin/src/pluginId';

interface MuxAssetFilter {
  upload_id?: string;
  asset_id?: string;
}

const { Webhooks } = Mux;

const model = `plugin::${pluginId}.mux-asset`;

const resolveMuxAssets = async (filters:MuxAssetFilter) => {
  const params = { filters };
  
  const muxAssets = await strapi.entityService.findMany(model, params);

  if (muxAssets.length === 1) {
    return muxAssets[0];
  }
  else {
    throw new Error('Unable to resolve mux-asset');
  }
};

const processWebhookEvent = async (webhookEvent:any) => {
  const { type, data } = webhookEvent;

  switch (type) {
    case 'video.upload.asset_created': {
      const muxAsset = await resolveMuxAssets({ upload_id: data.id });
      return [
        muxAsset.id,
        {
          data: { asset_id: data.asset_id }
        }
      ];
    }
    case 'video.asset.ready': {
      const muxAsset = await resolveMuxAssets({ asset_id: data.id });
      return [
        muxAsset.id,
        {
          data: {
            playback_id: data.playback_ids[0].id,
            duration: data.duration,
            aspect_ratio: data.aspect_ratio,
            isReady: true
          }
        }
      ];
    }
    case 'video.asset.errored': {
      const muxAsset = await resolveMuxAssets({ asset_id: data.id });
      return [
        muxAsset.id,
        {
          data: {
            error_message: `${data.errors.type}: ${data.errors.messages[0] || ''}`
          }
        }
      ];
    }
    default: return undefined;
  }
}

// Do not go gentle into that good night,
// Old age should burn and rave at close of day;
// Rage, rage against the dying of the light.
const thumbnail = async (ctx: Context) => {
  const { playbackId } = ctx.params;

  const response = await axios.get(
    `https://image.mux.com/${playbackId}/thumbnail.png`,
    {
      params: ctx.query,
      responseType: 'stream'
    }
  );

  ctx.response.set('content-type', response.headers['content-type']);
  ctx.body = response.data;
};

const submitDirectUpload = async (ctx:Context) => {
  const { title, origin } = ctx.request.body;

  const cors = origin || ctx.request.header.origin

  const result = await getService('mux').getDirectUploadUrl(cors);

  const data = {
    title,
    upload_id: result.id
  };

  await strapi.entityService.create(model, { data });

  ctx.send(result);
};

const submitRemoteUpload = async (ctx:Context) => {
  const { body } = ctx.request;

  if(!body.url) {
    ctx.badRequest("ValidationError", { errors: { "url": ["url cannot be empty"]}});
    
    return;
  }

  const result = await getService('mux').createAsset(body.url);

  const data = {
    asset_id: result.id,
    title: body.title,
    url: body.url
  };

  const response = await strapi.entityService.create(model, { data });

  ctx.send(response);
};

const deleteMuxAsset = async (ctx: Context) => {
  const { id, delete_on_mux } = ctx.request.body;

  if(!id) {
    ctx.badRequest("ValidationError", { errors: { "id": ["id needs to be defined"]}});

    return;
  }

  // Ensure that the mux-asset entry exists for the id
  const muxAsset = await strapi.entityService.findOne(model, id);

  if (!muxAsset) {
    ctx.notFound('mux-asset.notFound');

    return;
  }

  // Delete mux-asset entry
  const { asset_id, upload_id } = await strapi.entityService.delete(model, id);
  const result = { success: true, deletedOnMux: false };

  // If the directive exists deleting the Asset from Mux
  if (delete_on_mux) {
    try {
      // Resolve the asset_id
      // - Use the asset_id that was available on the deleted mux-asset entry
      // - Else, resolve it from Mux using the upload_id
      const assetId = asset_id !== '' ? asset_id : (await getService('mux').getAssetByUploadId(upload_id)).id;

      const deletedOnMux = await getService('mux').deleteAsset(assetId);

      result.deletedOnMux = deletedOnMux;
    } catch (err) {}
  }

  ctx.send(result);
};

const muxWebhookHandler = async (ctx:Context) => {
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

  const outcome = await processWebhookEvent(body);

  if (outcome === undefined) {
    ctx.send('ignored');
  } else {
    const [id, params] = outcome;
    const result = await strapi.entityService.update(model, id, params);

    ctx.send(result);
  }
};

export = {
  submitDirectUpload,
  submitRemoteUpload,
  deleteMuxAsset,
  muxWebhookHandler,
  thumbnail
};
