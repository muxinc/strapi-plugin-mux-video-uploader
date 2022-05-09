import Mux from '@mux/mux-node';
import axios from 'axios';
import { Context } from 'koa';

import { getService, Config } from '../utils';
import pluginId from './../../admin/src/pluginId';

interface MuxAssetFilter {
  upload_id?: string;
  asset_id?: string;
  playback_id?: string;
  title?: string;
}

const { Webhooks } = Mux;

const model = `plugin::${pluginId}.mux-asset`;

const resolveMuxAssets = async (filters: MuxAssetFilter) => {
  const params = { filters };

  const muxAssets = await strapi.entityService.findMany(model, params);

  if (muxAssets.length === 1) {
    return muxAssets[0];
  } else {
    throw new Error('Unable to resolve mux-asset');
  }
};

const tryResolveMuxAssets = async (filters: MuxAssetFilter) => {
  try {
    return await resolveMuxAssets(filters);
  } catch (_) {
    return undefined;
  }
};

const processWebhookEvent = async (webhookEvent: any) => {
  const { type, data } = webhookEvent;

  switch (type) {
    case 'video.upload.asset_created': {
      const muxAsset = await resolveMuxAssets({ upload_id: data.id });
      return [
        muxAsset.id,
        {
          data: { asset_id: data.asset_id },
        },
      ];
    }
    case 'video.asset.ready': {
      const muxAsset = await resolveMuxAssets({ asset_id: data.id });
      return [
        muxAsset.id,
        {
          data: {
            playback_id: data.playback_ids[0].id,
            isReady: true,
          },
        },
      ];
    }
    case 'video.asset.errored': {
      const muxAsset = await resolveMuxAssets({ asset_id: data.id });
      return [
        muxAsset.id,
        {
          data: {
            error_message: `${data.errors.type}: ${
              data.errors.messages[0] || ''
            }`,
          },
        },
      ];
    }
    default:
      return undefined;
  }
};

const playbackToken = async (ctx: Context) => {
  const { type, playbackId } = ctx.params;

  const playbackToken = await getService('mux').getPlaybackToken(
    playbackId,
    type,
    ctx.query
  );

  ctx.send(playbackToken);
};

// Do not go gentle into that good night,
// Old age should burn and rave at close of day;
// Rage, rage against the dying of the light.
const thumbnail = async (ctx: Context) => {
  const { playbackId } = ctx.params;

  const muxAsset = await resolveMuxAssets({ playback_id: playbackId });

  let params = ctx.query;

  if (muxAsset.playback_policy === 'signed') {
    const playbackToken = await getService('mux').getPlaybackToken(
      playbackId,
      'thumbnail',
      ctx.query
    );

    params = { token: playbackToken };
  }

  const response = await axios.get(
    `https://image.mux.com/${playbackId}/thumbnail.png`,
    {
      params,
      responseType: 'stream',
    }
  );

  ctx.response.set('content-type', response.headers['content-type']);
  ctx.body = response.data;
};

const index = async (ctx: Context) => ctx.send({ message: 'ok' });

const submitDirectUpload = async (ctx: Context) => {
  const data = ctx.request.body;

  const result = await getService('mux').getDirectUploadUrl(
    ctx.request.body?.playback_policy ?? 'signed',
    ctx.request.header.origin
  );

  data.upload_id = result.id;

  let muxAsset = await tryResolveMuxAssets({ title: data.title });

  if (muxAsset) {
    const assetId = muxAsset.asset_id
      ? muxAsset.asset_id
      : await getService('mux').getAssetIdByUploadId(muxAsset.upload_id);

    data.asset_id = null;
    data.playback_id = null;

    await strapi.entityService.update(model, muxAsset.id, { data });
    await getService('mux').deleteAsset(assetId);
  } else {
    muxAsset = await strapi.entityService.create(model, { data });
  }

  ctx.send({
    data: result,
    muxAsset,
  });
};

const submitRemoteUpload = async (ctx: Context) => {
  const { body } = ctx.request;

  if (!body.url) {
    ctx.badRequest('ValidationError', {
      errors: { url: ['url cannot be empty'] },
    });

    return;
  }

  const result = await getService('mux').createAsset(body.url);

  const data = {
    asset_id: result.id,
    title: body.title,
    url: body.url,
  };

  const response = await strapi.entityService.create(model, { data });

  ctx.send(response);
};

const deleteMuxAsset = async (ctx: Context) => {
  const data = ctx.request.body;

  if (!data.upload_id) {
    ctx.badRequest('ValidationError', {
      errors: { upload_id: ['upload_id needs to be defined'] },
    });

    return;
  }

  strapi.entityService.delete(model, data.id);

  const result = { success: true, deletedOnMux: false };

  if (data.delete_on_mux === 'true') {
    const assetId =
      data.asset_id !== ''
        ? data.asset_id
        : await getService('mux').getAssetIdByUploadId(data.upload_id);

    const deletedOnMux = await getService('mux').deleteAsset(assetId);

    result.deletedOnMux = deletedOnMux;
  }

  ctx.send(result);
};

const muxWebhookHandler = async (ctx: Context) => {
  const body = ctx.request.body;
  const sigHttpHeader = ctx.request.headers['mux-signature'];

  const config = await Config.getConfig('general');

  if (
    sigHttpHeader === undefined ||
    sigHttpHeader === '' ||
    (Array.isArray(sigHttpHeader) && sigHttpHeader.length < 0)
  ) {
    ctx.throw(401, 'Webhook signature is missing');
  }

  if (Array.isArray(sigHttpHeader) && sigHttpHeader.length > 1) {
    ctx.throw(401, 'we have an unexpected amount of signatures');
  }

  let sig;

  if (Array.isArray(sigHttpHeader)) {
    sig = sigHttpHeader[0];
  } else {
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
  index,
  submitDirectUpload,
  submitRemoteUpload,
  deleteMuxAsset,
  muxWebhookHandler,
  playbackToken,
  thumbnail,
};
