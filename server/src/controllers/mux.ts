import axios from 'axios';
import { Context } from 'koa';
import { z } from 'zod';

import { StoredTextTrack, UploadConfig, UploadDataWithoutFile } from '../../../types/shared-types';
import { PLUGIN_NAME } from '../constants';
import { tryBackfillOutputs } from '../robots/outputs';
import { resolveUploadDirectives } from '../robots/upload-directives';
import { Config, getService } from '../utils';
import { parseRequest } from '../utils/parse-json-body';
import { resolveMuxAssetOrNull } from '../utils/resolve-mux-asset';
import { storeTextTracks } from '../utils/text-tracks';
import { ASSET_MODEL, TEXT_TRACK_MODEL } from '../utils/types';
import { nonEmptyString } from '../utils/values';
import { dispatchWebhookEvent, WebhookEvent, WebhookOutcome } from '../webhooks';
import { parseBody } from './robots';

// Do not go gentle into that good night,
// Old age should burn and rave at close of day;
// Rage, rage against the dying of the light.
const thumbnail = async (ctx: Context) => {
  const { documentId } = ctx.params;
  const { token } = ctx.query;

  let imageUrl = `https://image.mux.com/${documentId}/thumbnail.jpg`;

  if (token) {
    imageUrl += `?token=${token}`;
  }

  const response = await axios.get(imageUrl, {
    responseType: 'stream',
  });

  ctx.response.set('content-type', 'image/jpeg');
  ctx.body = response.data;
};

// Though wise men at their end know dark is right,
// Because their words had forked no lightning they
// Do not go gentle into that good night.
const storyboard = async (ctx: Context) => {
  const { documentId } = ctx.params;
  const { token } = ctx.query;

  let imageUrl = `https://image.mux.com/${documentId}/storyboard.vtt?format=webp`;

  if (token) {
    imageUrl += `&token=${token}`;
  }

  const response = await axios.get(imageUrl, {
    responseType: 'stream',
  });

  ctx.response.set('content-type', 'text/vtt');
  ctx.body = response.data;
};

/** `undefined` once a 400 has been sent: nothing is stored and Mux isn't called. */
async function parseUploadRequest(ctx: Context) {
  const body = parseBody(ctx, UploadDataWithoutFile);
  if (!body) return undefined;

  const params = { body };
  const config = UploadConfig.safeParse(params.body);

  if (!config.success) {
    throw new Error(config.error.message);
  }

  const { custom_text_tracks = [] } = config.data;

  const storedTextTracks = await storeTextTracks(custom_text_tracks);

  const directives = await resolveUploadDirectives({
    canRunRobots: !!ctx.state?.userAbility?.can(`plugin::${PLUGIN_NAME}.robots.run`),
    requested: config.data.directives,
  });

  return {
    storedTextTracks,
    directives,
    config: config.data,
    params,
  };
}

const postDirectUpload = async (ctx: Context) => {
  const request = await parseUploadRequest(ctx);
  if (!request) return;

  const { config, storedTextTracks, directives, params } = request;

  const result = await getService('mux').getDirectUploadUrl({
    config,
    storedTextTracks,
    corsOrigin: ctx.request.header.origin,
    directives,
  });

  const data = {
    title: params.body?.title || '',
    upload_id: result.id,
    ...config,
  };

  await strapi.documents(ASSET_MODEL).create({ data });

  ctx.send(result);
};

const postRemoteUpload = async (ctx: Context) => {
  const request = await parseUploadRequest(ctx);
  if (!request) return;

  const { config, storedTextTracks, directives, params } = request;

  if (params.body?.upload_type !== 'url' || !params.body.url) {
    // ctx.badRequest's type seems to be off - we're following the official example: https://docs.strapi.io/dev-docs/error-handling#controllers-and-middlewares
    (ctx as any).badRequest('ValidationError', { errors: { url: ['url cannot be empty'] } });

    return;
  }

  const result = await getService('mux').createRemoteAsset({
    config,
    storedTextTracks,
    url: params.body.url,
    directives,
  });

  const data = {
    asset_id: result.id,
    title: params.body?.title || '',
    url: params.body.url,
    ...config,
  };

  await strapi.documents(ASSET_MODEL).create({ data });
  await tryBackfillOutputs(result.id);

  ctx.send(result);
};

const deleteMuxAsset = async (ctx: Context) => {
  const { params, query } = parseRequest(
    ctx,
    null,
    z.object({ documentId: z.string().or(z.number()) }),
    // A query string carries `"false"`, which is truthy: only `true` and `"true"` delete on Mux.
    z.object({
      delete_on_mux: z
        .union([z.boolean(), z.string()])
        .optional()
        .transform((value) => value === undefined || value === true || value === 'true'),
    })
  );

  // Ensure that the mux-asset entry exists for the id
  // @ts-ignore - v5 migration
  // const muxAsset = await strapi.documents(ASSET_MODEL).findOne(documentId);
  const muxAsset = await strapi.db.query(ASSET_MODEL).findOne({ where: { id: params.documentId } });

  if (!muxAsset) {
    ctx.notFound('mux-asset.notFound');

    return;
  }

  // Delete mux-asset entry
  // @ts-ignore - v5 migration
  // const deleteRes = await strapi.documents(ASSET_MODEL).delete(params.documentId);
  const deleteRes = await strapi.db.query(ASSET_MODEL).delete({ where: { id: params.documentId } });
  if (!deleteRes) {
    ctx.send({ success: false });
    return;
  }

  // @ts-ignore - v5 migration
  const { asset_id, upload_id } = deleteRes;
  const result = { success: true, deletedOnMux: false };

  // If the directive exists deleting the Asset from Mux
  if (query.delete_on_mux) {
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

// Set by koa-body when strapi::body has includeUnparsed enabled
const UNPARSED_BODY = Symbol.for('unparsedBody');

const muxWebhookHandler = async (ctx: Context) => {
  const rawBody = (ctx.request.body as Record<symbol, unknown> | undefined)?.[UNPARSED_BODY];

  if (typeof rawBody !== 'string') {
    // koa-body keeps the raw body of JSON requests only, and Mux always sends JSON.
    if (!ctx.is('json')) ctx.throw(415, 'Webhooks must be JSON');

    strapi.log.error(
      '[mux-video-uploader] Webhook rejected: the raw request body is unavailable. Set `includeUnparsed: true` on `strapi::body` in config/middlewares.'
    );
    ctx.throw(500, 'Webhook could not be verified');
  }

  // The SDK would blame its MUX_WEBHOOK_SECRET env var, which this plugin doesn't read.
  const { webhookSigningSecret } = await Config.getConfig();
  if (!webhookSigningSecret) {
    strapi.log.warn(
      "[mux-video-uploader] Webhook rejected: the plugin's webhookSigningSecret is empty. Copy the signing secret " +
        'from Mux → Settings → Webhooks into the plugin config.'
    );
    ctx.throw(401, 'Invalid webhook signature');
  }

  let event: WebhookEvent;

  try {
    event = (await getService('mux').unwrapWebhook(rawBody, ctx.request.headers)) as unknown as WebhookEvent;
  } catch (error) {
    strapi.log.warn(`[mux-video-uploader] Webhook rejected: ${error instanceof Error ? error.message : error}`);
    ctx.throw(401, 'Invalid webhook signature');
  }

  // Every verified event answers 200, handled or not. Only an unexpected error answers 500, so Mux
  // delivers the event again.
  let outcome: WebhookOutcome;

  try {
    outcome = await dispatchWebhookEvent(event);
  } catch (error) {
    strapi.log.error(
      `[mux-video-uploader] Webhook ${event.type} could not be processed: ${error instanceof Error ? error.message : error}`
    );
    ctx.throw(500, 'Webhook could not be processed');
  }

  ctx.send(outcome);
};

/** Signs only the playback IDs of this Strapi's videos. `:documentId` is a playback ID. */
const signMuxPlaybackId = async (ctx: Context) => {
  const playbackId = nonEmptyString(ctx.params.documentId);
  const { type } = ctx.query;

  if (!playbackId || !(await resolveMuxAssetOrNull({ playback_id: playbackId }))) {
    ctx.notFound('mux-asset.notFound');
    return;
  }

  const result = await getService('mux').signPlaybackId(playbackId, type as string);

  ctx.send(result);
};

/**
 * A header value Node accepts for any file name (RFC 6266): an ASCII stand-in, plus the real name
 * percent-encoded for clients that read `filename*`.
 */
function attachmentDisposition(name: string) {
  const fallback = name.replace(/[^\x20-\x7e]|["\\]/g, '_');
  // encodeURIComponent throws on a lone surrogate, which a broken file name can carry.
  const wellFormed = name.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '\uFFFD');
  const encoded = encodeURIComponent(wellFormed).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );

  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

/**
 * Returns a text track stored in Strapi so Mux can download and parse it as an asset's subtitle/captions
 * For custom text tracks only.
 * @docs https://docs.mux.com/guides/add-subtitles-to-your-videos
 **/
const textTrack = async (ctx: Context) => {
  const { documentId } = ctx.params;

  // The URL carries the stored track's `documentId` (see `getStrapiTextTrackUrl`), which can't be guessed.
  const track =
    typeof documentId === 'string' && documentId !== ''
      ? ((await strapi.db.query(TEXT_TRACK_MODEL).findOne({ where: { documentId } })) as StoredTextTrack | null)
      : null;

  if (!track) {
    ctx.notFound('mux-text-track.notFound');

    return;
  }

  const contentType = `${track.file.type}; charset=utf-8`;
  ctx.set({ 'Content-Type': contentType, 'Content-Disposition': attachmentDisposition(track.file.name) });
  ctx.type = `${track.file.type}; charset=utf-8`;
  ctx.body = track.file.contents;
};

export default {
  postDirectUpload,
  postRemoteUpload,
  deleteMuxAsset,
  muxWebhookHandler,
  thumbnail,
  storyboard,
  signMuxPlaybackId,
  textTrack,
};
