import axios from 'axios';
import { Context } from 'koa';

import { RequestedUploadConfig, StoredTextTrack, UploadConfig } from '../../types/shared-types';
import { Config, getService } from '../utils';
import pluginId from './../../admin/src/pluginId';

interface MuxAssetFilter {
  upload_id?: string;
  asset_id?: string;
}

const ASSET_MODEL = `plugin::${pluginId}.mux-asset` as const;
const TEXT_TRACK_MODEL = `plugin::${pluginId}.mux-text-track` as const;

const resolveMuxAssets = async (filtersRaw: MuxAssetFilter) => {
  const filters = Object.fromEntries(Object.entries(filtersRaw).filter(([, value]) => value !== undefined));

  if (Object.keys(filters).length === 0) throw new Error('Unable to resolve mux-asset');

  const muxAssets = await strapi.entityService.findMany(ASSET_MODEL, { filters: filters as any });

  const asset = muxAssets ? (Array.isArray(muxAssets) ? muxAssets[0] : muxAssets) : undefined;
  if (!asset) throw new Error('Unable to resolve mux-asset');

  return asset;
};

const processWebhookEvent = async (webhookEvent: any) => {
  const { type, data } = webhookEvent;

  switch (type) {
    case 'video.asset.updated': {
      const muxAsset = await resolveMuxAssets({ upload_id: data.upload_id, asset_id: data.id });
      return [
        muxAsset.id,
        {
          data: { asset_data: data },
        },
      ] as const;
    }
    case 'video.upload.asset_created': {
      const muxAsset = await resolveMuxAssets({ upload_id: data.id });
      return [
        muxAsset.id,
        {
          data: { asset_id: data.asset_id },
        },
      ] as const;
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
            isReady: true,
          },
        },
      ] as const;
    }
    case 'video.asset.errored': {
      const muxAsset = await resolveMuxAssets({ asset_id: data.id });
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
  const body = (() => {
    try {
      return JSON.parse(ctx.request.body) as RequestedUploadConfig & {
        title?: string;
        url?: string;
      };
    } catch (error) {
      ctx.badRequest({ errors: { body: 'invalid body' } });
      throw new Error('invalid-body');
    }
  })();

  const config = UploadConfig.safeParse(body);

  if (!config.success) {
    throw new Error(config.error.message);
  }

  const { custom_text_tracks = [] } = config.data;

  const storedTextTracks = await Promise.all(
    custom_text_tracks.map(async (track) => {
      const { id } = await strapi.entityService.create(TEXT_TRACK_MODEL, { data: track });

      return { ...track, id };
    })
  );

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

  if (!body.url) {
    // @ts-expect-error
    ctx.badRequest('ValidationError', { errors: { url: ['url cannot be empty'] } });

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
  const { id, delete_on_mux } = (() => {
    try {
      return JSON.parse(ctx.request.body) as { id: string; delete_on_mux: boolean };
    } catch (error) {
      // @ts-expect-error
      ctx.badRequest('ValidationError', { errors: { body: 'invalid body' } });
      throw new Error('invalid-body');
    }
  })();

  if (!id) {
    // @ts-expect-error
    ctx.badRequest('ValidationError', { errors: { id: ['id needs to be defined'] } });

    return;
  }

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

export = {
  submitDirectUpload,
  submitRemoteUpload,
  deleteMuxAsset,
  muxWebhookHandler,
  thumbnail,
  signMuxPlaybackId,
  textTrack,
};
