import axios from 'axios';
import { Context } from 'koa';
import { z } from 'zod';

import { StoredTextTrack, UploadConfig, UploadDataWithoutFile } from '../../types/shared-types';
import { Config, getService } from '../utils';
import { parseJSONBody } from '../utils/parse-json-body';
import { resolveMuxAsset } from '../utils/resolve-mux-asset';
import { storeTextTracks } from '../utils/text-tracks';
import { ASSET_MODEL, TEXT_TRACK_MODEL } from '../utils/types';

const processWebhookEvent = async (webhookEvent: any) => {
  const { type, data } = webhookEvent;

  switch (type) {
    case 'video.asset.updated': {
      const muxAsset = await resolveMuxAsset({ upload_id: data.upload_id, asset_id: data.object?.id || data.id });
      return [
        muxAsset.id,
        {
          data: { asset_data: data },
        },
      ] as const;
    }
    case 'video.upload.asset_created': {
      const muxAsset = await resolveMuxAsset({ upload_id: data.id });
      return [
        muxAsset.id,
        {
          data: { asset_id: data.asset_id },
        },
      ] as const;
    }
    case 'video.asset.ready': {
      const muxAsset = await resolveMuxAsset({ asset_id: data.id });
      return [
        muxAsset.id,
        {
          data: {
            playback_id: data.playback_ids[0].id,
            duration: data.duration,
            aspect_ratio: data.aspect_ratio,
            isReady: true,
            asset_data: data,
          },
        },
      ] as const;
    }
    case 'video.asset.errored': {
      const muxAsset = await resolveMuxAsset({ asset_id: data.id });
      return [
        muxAsset.id,
        {
          data: {
            error_message: `${data.errors.type}: ${data.errors.messages[0] || ''}`,
          },
        },
      ] as const;
    }
    default:
      return undefined;
  }
};

// Do not go gentle into that good night,
// Old age should burn and rave at close of day;
// Rage, rage against the dying of the light.
const thumbnail = async (ctx: Context) => {
  const { playbackId } = ctx.params;
  const { token } = ctx.query;

  let imageUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;

  if (token) {
    imageUrl += `?token=${token}`;
  }

  const response = await axios.get(imageUrl, {
    responseType: 'stream',
  });

  ctx.response.set('content-type', response.headers['content-type']);
  ctx.body = response.data;
};

async function parseUploadRequest(ctx: Context) {
  const body = parseJSONBody(ctx, UploadDataWithoutFile);

  const config = UploadConfig.safeParse(body);

  if (!config.success) {
    throw new Error(config.error.message);
  }

  const { custom_text_tracks = [] } = config.data;

  const storedTextTracks = await storeTextTracks(custom_text_tracks);

  return {
    storedTextTracks,
    config: config.data,
    body,
  };
}

const submitDirectUpload = async (ctx: Context) => {
  const { config, storedTextTracks, body } = await parseUploadRequest(ctx);

  const result = await getService('mux').getDirectUploadUrl({
    config,
    storedTextTracks,
    corsOrigin: ctx.request.header.origin,
  });

  const data = {
    title: body.title || '',
    upload_id: result.id,
    ...config,
  };

  await strapi.entityService.create(ASSET_MODEL, { data });

  ctx.send(result);
};

const submitRemoteUpload = async (ctx: Context) => {
  const { config, storedTextTracks, body } = await parseUploadRequest(ctx);

  if (body.upload_type !== 'url' || !body.url) {
    // ctx.badRequest's type seems to be off - we're following the official example: https://docs.strapi.io/dev-docs/error-handling#controllers-and-middlewares
    (ctx as any).badRequest('ValidationError', { errors: { url: ['url cannot be empty'] } });

    return;
  }

  const result = await getService('mux').createRemoteAsset({ config, storedTextTracks, url: body.url });

  const data = {
    asset_id: result.id,
    title: body.title || '',
    url: body.url,
    ...config,
  };

  await strapi.entityService.create(ASSET_MODEL, { data });

  ctx.send(result);
};

const deleteMuxAsset = async (ctx: Context) => {
  const { id, delete_on_mux } = parseJSONBody(
    ctx,
    z.object({ id: z.string().or(z.number()), delete_on_mux: z.boolean().default(true) })
  );

  // Ensure that the mux-asset entry exists for the id
  const muxAsset = await strapi.entityService.findOne(ASSET_MODEL, id);

  if (!muxAsset) {
    ctx.notFound('mux-asset.notFound');

    return;
  }

  // Delete mux-asset entry
  const deleteRes = await strapi.entityService.delete(ASSET_MODEL, id);
  if (!deleteRes) {
    ctx.send({ success: false });
    return;
  }

  const { asset_id, upload_id } = deleteRes;
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
    const result = await strapi.entityService.update(ASSET_MODEL, id, params as any);

    ctx.send(result);
  }
};

const signMuxPlaybackId = async (ctx: Context) => {
  const { playbackId } = ctx.params;
  const { type } = ctx.query;

  const result = await getService('mux').signPlaybackId(playbackId, type as string);

  ctx.send(result);
};

/**
 * Returns a text track stored in Strapi so Mux can download and parse it as an asset's subtitle/captions
 * For custom text tracks only.
 * @docs https://docs.mux.com/guides/add-subtitles-to-your-videos
 **/
const textTrack = async (ctx: Context) => {
  const { trackId } = ctx.params;

  const track = (await strapi.entityService.findOne(TEXT_TRACK_MODEL, trackId)) as StoredTextTrack | undefined;

  if (!track) {
    ctx.notFound('mux-text-track.notFound');

    return;
  }

  const contentType = `${track.file.type}; charset=utf-8`;
  ctx.set({ 'Content-Type': contentType, 'Content-Disposition': `attachment; filename=${track.file.name}` });
  ctx.type = `${track.file.type}; charset=utf-8`;
  ctx.body = track.file.contents;
};

export default {
  submitDirectUpload,
  submitRemoteUpload,
  deleteMuxAsset,
  muxWebhookHandler,
  thumbnail,
  signMuxPlaybackId,
  textTrack,
};
