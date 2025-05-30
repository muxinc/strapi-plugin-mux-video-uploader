"use strict";
const zod = require("zod");
const axios = require("axios");
const Mux = require("@mux/mux-node");
const _interopDefault = (e) => e && e.__esModule ? e : { default: e };
const axios__default = /* @__PURE__ */ _interopDefault(axios);
const Mux__default = /* @__PURE__ */ _interopDefault(Mux);
const PLUGIN_NAME = "mux-video-uploader";
const bootstrap = async ({ strapi: strapi2 }) => {
  if (Object.keys(strapi2.plugins).indexOf("users-permissions") === -1) {
    throw new Error("The users-permissions plugin is required in order to use the Mux Video Uploader");
  }
  const actions = [
    // App
    {
      section: "plugins",
      displayName: "Read",
      uid: "read",
      pluginName: PLUGIN_NAME
    },
    {
      section: "plugins",
      displayName: "Create",
      uid: "create",
      pluginName: PLUGIN_NAME
    },
    {
      section: "plugins",
      displayName: "Update",
      uid: "update",
      pluginName: PLUGIN_NAME
    },
    {
      section: "plugins",
      displayName: "Delete",
      uid: "delete",
      pluginName: PLUGIN_NAME
    },
    // Settings
    {
      section: "plugins",
      displayName: "Read",
      subCategory: "settings",
      uid: "settings.read",
      pluginName: PLUGIN_NAME
    },
    {
      section: "plugins",
      displayName: "Update",
      subCategory: "settings",
      uid: "settings.update",
      pluginName: PLUGIN_NAME
    }
  ];
  await strapi2.admin.services.permission.actionProvider.registerMany(actions);
};
const destroy = ({ strapi: strapi2 }) => {
};
const register = ({ strapi: strapi2 }) => {
};
const config = {
  default: {
    accessTokenId: "",
    secretKey: "",
    webhookSigningSecret: "",
    playbackSigningId: "",
    playbackSigningSecret: ""
  },
  validator(config2) {
    const missingConfigs = [];
    if (!config2.accessTokenId) {
      missingConfigs.push("accessTokenId");
    }
    if (!config2.secretKey) {
      missingConfigs.push("secretKey");
    }
    if (missingConfigs.length > 0) {
      throw new Error(
        `Please remember to set up the file based config for your plugin.  Refer to the "Configuration" of the README for this plugin for additional details.  Configs missing: ${missingConfigs.join(", ")}`
      );
    }
  }
};
const muxAsset$1 = {
  kind: "collectionType",
  collectionName: "muxassets",
  info: {
    description: "Represents a Mux Asset item, including upload and playback details",
    displayName: "Mux Asset",
    singularName: "mux-asset",
    pluralName: "mux-assets"
  },
  pluginOptions: {
    "content-manager": {
      visible: true
    },
    "content-type-builder": {
      visible: true
    }
  },
  options: {
    draftAndPublish: false
  },
  attributes: {
    title: {
      type: "string",
      private: false,
      required: true,
      maxLength: 255,
      minLength: 3,
      configurable: true
    },
    upload_id: {
      type: "string",
      required: false,
      maxLength: 255
    },
    asset_id: {
      type: "string",
      required: false,
      maxLength: 255
    },
    playback_id: {
      type: "string",
      required: false,
      maxLength: 255
    },
    signed: {
      type: "boolean",
      default: false,
      required: true
    },
    error_message: {
      type: "string",
      required: false,
      maxLength: 255
    },
    isReady: {
      type: "boolean",
      default: false,
      required: false
    },
    duration: {
      type: "decimal",
      required: false
    },
    aspect_ratio: {
      type: "string",
      required: false
    },
    asset_data: {
      type: "json"
    }
  }
};
const muxTextTrack = {
  kind: "collectionType",
  collectionName: "muxtexttracks",
  info: {
    description: "Temporary storage for user-defined subtitles & captions sent to Mux during video uploads",
    displayName: "Mux Text Track",
    singularName: "mux-text-track",
    pluralName: "mux-text-tracks"
  },
  pluginOptions: {
    "content-manager": {
      visible: false
    },
    "content-type-builder": {
      visible: false
    }
  },
  options: {
    draftAndPublish: false
  },
  attributes: {
    name: {
      type: "string",
      private: false,
      required: true
    },
    language_code: {
      type: "string",
      private: false,
      required: true
    },
    closed_captions: {
      type: "boolean",
      private: false,
      required: true
    },
    file: {
      type: "json",
      private: false,
      required: true
    }
  }
};
const contentTypes = {
  "mux-asset": { schema: muxAsset$1 },
  "mux-text-track": { schema: muxTextTrack }
};
const pluginId$1 = PLUGIN_NAME;
const ASSET_MODEL = `plugin::${pluginId$1}.mux-asset`;
const TEXT_TRACK_MODEL = `plugin::${pluginId$1}.mux-text-track`;
const resolveMuxAsset = async (filters) => {
  const muxAssets = await strapi.db.query(ASSET_MODEL).findMany({
    filters
  });
  const asset = muxAssets ? Array.isArray(muxAssets) ? muxAssets[0] : muxAssets : void 0;
  if (!asset)
    throw new Error("Unable to resolve mux-asset");
  return asset;
};
const getConfig = async () => await strapi.config.get(`plugin::${PLUGIN_NAME}`);
const getService = (name2) => {
  return strapi.plugin(PLUGIN_NAME).service(name2);
};
const SUPPORTED_MUX_LANGUAGES = [
  { label: "English", code: "en", state: "Stable" },
  { label: "Spanish", code: "es", state: "Stable" },
  { label: "Italian", code: "it", state: "Stable" },
  { label: "Portuguese", code: "pt", state: "Stable" },
  { label: "German", code: "de", state: "Stable" },
  { label: "French", code: "fr", state: "Stable" },
  { label: "Polish", code: "pl", state: "Beta" },
  { label: "Russian", code: "ru", state: "Beta" },
  { label: "Dutch", code: "nl", state: "Beta" },
  { label: "Catalan", code: "ca", state: "Beta" },
  { label: "Turkish", code: "tr", state: "Beta" },
  { label: "Swedish", code: "sv", state: "Beta" },
  { label: "Ukrainian", code: "uk", state: "Beta" },
  { label: "Norwegian", code: "no", state: "Beta" },
  { label: "Finnish", code: "fi", state: "Beta" },
  { label: "Slovak", code: "sk", state: "Beta" },
  { label: "Greek", code: "el", state: "Beta" },
  { label: "Czech", code: "cs", state: "Beta" },
  { label: "Croatian", code: "hr", state: "Beta" },
  { label: "Danish", code: "da", state: "Beta" },
  { label: "Romanian", code: "ro", state: "Beta" },
  { label: "Bulgarian", code: "bg", state: "Beta" }
];
const SUPPORTED_MUX_LANGUAGES_VALUES = SUPPORTED_MUX_LANGUAGES.map((l) => l.code);
const TextTrackFile = zod.z.object({
  contents: zod.z.string(),
  type: zod.z.string(),
  name: zod.z.string(),
  size: zod.z.number()
});
const CustomTextTrack = zod.z.object({
  file: TextTrackFile,
  name: zod.z.string(),
  language_code: zod.z.string(),
  closed_captions: zod.z.boolean().default(false),
  stored_track: zod.z.custom((value) => typeof value === "object" && value && "id" in value).optional()
});
const UploadConfig = zod.z.object({
  /**
   * Enable static renditions by setting this to 'standard'. Can be overwritten on a per-asset basis.
   * @see {@link https://docs.mux.com/guides/video/enable-static-mp4-renditions#why-enable-mp4-support}
   * @defaultValue 'none'
   */
  mp4_support: zod.z.enum(["none", "standard"]).default("none"),
  /**
   * Max resolution tier can be used to control the maximum resolution_tier your asset is encoded, stored, and streamed at.
   * @see {@link https://docs.mux.com/guides/stream-videos-in-4k}
   * @defaultValue '1080p'
   */
  max_resolution_tier: zod.z.enum(["2160p", "1440p", "1080p"]).default("1080p"),
  /**
   * The video quality informs the cost, quality, and available platform features for the asset.
   * @see {@link https://docs.mux.com/guides/use-video-quality-levels}
   * @defaultValue 'plus'
   */
  video_quality: zod.z.enum(["basic", "plus"]).default("plus"),
  /**
   * Whether or not to use signed URLs, making the asset private
   * @see {@link https://docs.mux.com/guides/use-encoding-tiers}
   * @defaultValue 'false'
   */
  signed: zod.z.boolean().default(false),
  autogenerated_captions_languages: zod.z.array(
    zod.z.object({
      code: zod.z.enum(SUPPORTED_MUX_LANGUAGES_VALUES),
      isSourceLanguage: zod.z.boolean().default(false)
    })
  ).optional(),
  custom_text_tracks: zod.z.array(CustomTextTrack).optional(),
  upload_type: zod.z.enum(["file", "url"]).default("file")
}).transform((v) => {
  if (v.video_quality === "basic") {
    return {
      ...v,
      max_resolution_tier: "1080p",
      mp4_support: "none"
    };
  }
  return v;
});
zod.z.object({ title: zod.z.string().min(1) }).and(
  zod.z.discriminatedUnion("upload_type", [
    zod.z.object({ upload_type: zod.z.literal("file"), file: zod.z.custom((value) => value instanceof File) }),
    zod.z.object({ upload_type: zod.z.literal("url"), url: zod.z.string().url() })
  ])
).and(UploadConfig);
const UploadDataWithoutFile = zod.z.object({ title: zod.z.string().min(1) }).and(
  zod.z.discriminatedUnion("upload_type", [
    zod.z.object({ upload_type: zod.z.literal("file") }),
    zod.z.object({ upload_type: zod.z.literal("url"), url: zod.z.string().url() })
  ])
).and(UploadConfig);
function uploadConfigToNewAssetInput(config2, storedTextTracks = [], url) {
  const inputs = [];
  const base = {};
  if (config2.upload_type === "url") {
    base.url = url;
  }
  if (config2.autogenerated_captions_languages) {
    base.generated_subtitles = config2.autogenerated_captions_languages.map((language) => {
      const label = SUPPORTED_MUX_LANGUAGES.find((l) => l.code === language.code)?.label || language.code;
      return {
        language_code: language.code,
        name: language.isSourceLanguage ? `${label} (CC)` : label,
        type: "text",
        text_type: "subtitles",
        closed_captions: true
      };
    });
  }
  if (Object.keys(base).length > 0) {
    inputs.push(base);
  }
  if (storedTextTracks.length > 0) {
    inputs.push(...storedTextTracks.map(storedTextTrackToMuxTrack));
  }
  return inputs.length > 0 ? inputs : void 0;
}
const pluginId = "mux-video-uploader";
async function storeTextTracks(custom_text_tracks) {
  return await Promise.all(
    custom_text_tracks.map(async (track) => {
      const { id } = await strapi.entityService.create(TEXT_TRACK_MODEL, { data: track });
      return { ...track, id };
    })
  );
}
function storedTextTrackToMuxTrack(track) {
  return {
    type: "text",
    text_type: "subtitles",
    closed_captions: track.closed_captions,
    language_code: track.language_code,
    name: track.closed_captions ? `${track.name} (CC)` : track.name,
    url: getStrapiTextTrackUrl(track.id)
  };
}
const BACKEND_URI = strapi.config?.server.url;
function getStrapiTextTrackUrl(id) {
  return `${BACKEND_URI}/${pluginId}/mux-text-tracks/${id}`;
}
function getMuxTextTrackUrl({
  playback_id,
  track,
  signedToken
}) {
  return `https://stream.mux.com/${playback_id}/text/${track.id}.vtt${signedToken ? `?token=${signedToken}` : ""}`;
}
async function updateTextTracks(muxAsset2, newTracks) {
  if (!newTracks || !muxAsset2.asset_id || !muxAsset2.playback_id)
    return void 0;
  const { asset_id, playback_id } = muxAsset2;
  const { token } = await (async () => {
    if (!muxAsset2.signed)
      return { token: void 0 };
    return getService("mux").signPlaybackId(playback_id, "video");
  })();
  const existingTracks = muxAsset2.asset_data?.tracks || [];
  const removedTracks = existingTracks.filter(
    (track) => track.type === "text" && track.text_type === "subtitles" && !newTracks.find((t) => t.stored_track?.id === track.id)
  ) || [];
  const addedTracks = newTracks.filter((track) => !existingTracks.find((t) => t.id === track.stored_track?.id));
  const updatedTracks = newTracks.flatMap((track) => {
    const existingTrack = existingTracks.find(
      (t) => t.id === track.stored_track?.id && t.type === "text" && t.text_type === "subtitles"
    );
    if (!existingTrack)
      return [];
    const isDifferent = [
      existingTrack.language_code !== track.language_code,
      existingTrack.name !== track.name,
      // Ignore closed_captions for generated captions/subtitles
      existingTrack.text_source !== "generated_vod" && existingTrack.closed_captions !== track.closed_captions,
      track.file?.contents
    ].some(Boolean);
    if (!isDifferent)
      return [];
    return {
      track,
      prevId: existingTrack.id
    };
  });
  const alreadyInMuxWithoutFile = await Promise.all(
    updatedTracks.flatMap((t) => {
      const track_id = t.track.stored_track?.id;
      if (t.track.file || !track_id)
        return [];
      return new Promise(async (resolve, reject) => {
        try {
          const muxTrackRes = await fetch(
            getMuxTextTrackUrl({ playback_id, track: { id: track_id }, signedToken: token })
          );
          if (muxTrackRes.status !== 200)
            throw new Error(muxTrackRes.statusText);
          const contents = await muxTrackRes.text();
          const type2 = muxTrackRes.headers.get("content-type") || "text/vtt";
          const contentLength = muxTrackRes.headers.get("content-length");
          const file = TextTrackFile.parse({
            contents,
            type: type2,
            name: t.track.name,
            size: contentLength && !Number.isNaN(Number(contentLength)) ? Number(contentLength) : contents.length
          });
          resolve({
            ...t,
            track: {
              ...t.track,
              file
            }
          });
        } catch (error) {
          reject(error);
        }
      });
    })
  );
  const newStoredForDownload = await (async () => {
    try {
      return await storeTextTracks(
        [...addedTracks, ...updatedTracks.map((t) => t.track), ...alreadyInMuxWithoutFile.map((t) => t.track)].filter(
          (t) => t.file
        )
      );
    } catch (error) {
      console.error("\n\n[updateTextTracks / storeTextTracks]", error);
      throw new Error("Unable to store text tracks");
    }
  })();
  await (async () => {
    try {
      await getService("mux").deleteAssetTextTracks(asset_id, [
        ...removedTracks.flatMap((t) => t.id || []),
        ...updatedTracks.flatMap((t) => t.prevId || [])
      ]);
    } catch (error) {
      console.error("\n\n[updateTextTracks / deleteAssetTextTracks]", error);
      throw new Error("Unable to delete text tracks in Mux");
    }
  })();
  await (async () => {
    try {
      await getService("mux").createAssetTextTracks(asset_id, newStoredForDownload.map(storedTextTrackToMuxTrack));
    } catch (error) {
      console.error("\n\n[updateTextTracks / createAssetTextTracks]", error);
      throw new Error("Unable to create text tracks in Mux");
    }
  })();
}
const search = (ctx) => {
  const params = ctx.query;
  if (!params.sort) {
    params.sort = "createdAt";
  }
  if (!params.order) {
    params.order = "desc";
  }
  return strapi.documents(ASSET_MODEL).findMany(params);
};
const find = async (ctx) => {
  const entities = await search(ctx);
  const totalCount = await count(ctx);
  const items = entities.map((entity) => entity);
  return { items, totalCount };
};
const findOne = async (ctx) => {
  const { documentId } = ctx.params;
  return await strapi.db.query(ASSET_MODEL).findOne({
    where: { id: documentId }
  });
};
const count = (ctx) => {
  const params = ctx.query;
  return strapi.documents(ASSET_MODEL).count(params);
};
const create = async (ctx) => {
  const { body } = ctx.request.body;
  return await strapi.documents(ASSET_MODEL).create({ data: body });
};
const update = async (ctx) => {
  const { documentId } = ctx.params;
  const muxAsset2 = await resolveMuxAsset({ id: documentId });
  const { title, custom_text_tracks } = ctx.request.body;
  await updateTextTracks(muxAsset2, custom_text_tracks);
  if (typeof title === "string" && title) {
    await strapi.db.query(ASSET_MODEL).update({
      where: { id: documentId },
      data: { title }
    });
  }
  return { ok: true };
};
const del = async (ctx) => {
  const { documentId } = ctx.params;
  return await strapi.documents(ASSET_MODEL).delete(documentId);
};
const getByUploadId = async (ctx) => {
  const { uploadId } = ctx.params;
  if (!uploadId) {
    return ctx.badRequest("Upload ID is required");
  }
  return await strapi.db.query(ASSET_MODEL).findOne({
    where: { upload_id: uploadId }
  });
};
const getByAssetId = async (ctx) => {
  const { assetId } = ctx.params;
  if (!assetId) {
    return ctx.badRequest("Asset ID is required");
  }
  return await strapi.db.query(ASSET_MODEL).findOne({
    where: { asset_id: assetId }
  });
};
const getByPlaybackId = async (ctx) => {
  const { playbackId } = ctx.params;
  if (!playbackId) {
    return ctx.badRequest("Playback ID is required");
  }
  return await strapi.db.query(ASSET_MODEL).findOne({
    where: { playback_id: playbackId }
  });
};
const muxAsset = {
  find,
  findOne,
  count,
  create,
  update,
  del,
  getByUploadId,
  getByAssetId,
  getByPlaybackId
};
function parseRequest(ctx, bodySchema, paramsSchema, querySchema) {
  let bodyObject;
  try {
    const requestBody = ctx.request.body;
    bodyObject = requestBody && typeof requestBody === "object" ? requestBody : JSON.parse(requestBody);
  } catch (error) {
    ctx.badRequest("InvalidBody", { errors: { body: "invalid body" } });
    throw new Error("invalid-body");
  }
  const body = bodySchema?.safeParse(bodyObject);
  const params = paramsSchema?.safeParse(ctx.params);
  const query = querySchema?.safeParse(ctx.query);
  if (body && (!body.success || "error" in body)) {
    const errorMsg = "error" in body && typeof body.error === "object" && body.error && "message" in body.error ? body.error.message : "invalid-body";
    ctx.badRequest("ValidationError", {
      errors: {
        body: errorMsg
      }
    });
    throw new Error(errorMsg);
  }
  if (params && (!params.success || "error" in params)) {
    const errorMsg = "error" in params && typeof params.error === "object" && params.error && "message" in params.error ? params.error.message : "invalid-params";
    ctx.badRequest("ValidationError", {
      errors: {
        params: errorMsg
      }
    });
    throw new Error(errorMsg);
  }
  if (query && (!query.success || "error" in query)) {
    const errorMsg = "error" in query && typeof query.error === "object" && query.error && "message" in query.error ? query.error.message : "invalid-query";
    ctx.badRequest("ValidationError", {
      errors: {
        query: errorMsg
      }
    });
    throw new Error(errorMsg);
  }
  return {
    body: body?.data,
    params: params?.data,
    query: query?.data
  };
}
const processWebhookEvent = async (webhookEvent) => {
  const { type: type2, data } = webhookEvent;
  switch (type2) {
    case "video.upload.asset_created": {
      const muxAsset2 = await resolveMuxAsset({ upload_id: data.id });
      return [
        muxAsset2.id,
        {
          data: { asset_id: data.asset_id }
        }
      ];
    }
    case "video.asset.ready": {
      const muxAsset2 = await resolveMuxAsset({ asset_id: data.id });
      return [
        muxAsset2.id,
        {
          data: {
            playback_id: data.playback_ids[0].id,
            duration: data.duration,
            aspect_ratio: data.aspect_ratio,
            isReady: true,
            asset_data: data
          }
        }
      ];
    }
    case "video.upload.errored": {
      const muxAsset2 = await resolveMuxAsset({ upload_id: data.id });
      return [
        muxAsset2.id,
        {
          data: {
            error_message: `There was an unexpected error during upload`
          }
        }
      ];
    }
    case "video.asset.errored": {
      const muxAsset2 = await resolveMuxAsset({ asset_id: data.id });
      return [
        muxAsset2.id,
        {
          data: {
            error_message: `${data.errors.type}: ${data.errors.messages[0] || ""}`
          }
        }
      ];
    }
    default:
      return void 0;
  }
};
const thumbnail = async (ctx) => {
  const { documentId } = ctx.params;
  const { token, time, width, height, rotate, fit_mode, flip_v, flip_h, format = "jpg" } = ctx.query;
  let imageUrl = `https://image.mux.com/${documentId}/thumbnail.${format}`;
  const queryParams = new URLSearchParams();
  if (token) {
    queryParams.append("token", token);
  }
  if (time !== void 0) {
    queryParams.append("time", time);
  }
  if (width !== void 0) {
    queryParams.append("width", width);
  }
  if (height !== void 0) {
    queryParams.append("height", height);
  }
  if (rotate !== void 0) {
    queryParams.append("rotate", rotate);
  }
  if (fit_mode !== void 0) {
    queryParams.append("fit_mode", fit_mode);
  }
  if (flip_v !== void 0) {
    queryParams.append("flip_v", flip_v);
  }
  if (flip_h !== void 0) {
    queryParams.append("flip_h", flip_h);
  }
  const queryString = queryParams.toString();
  if (queryString) {
    imageUrl += `?${queryString}`;
  }
  const response = await axios__default.default.get(imageUrl, {
    responseType: "stream"
  });
  const contentType = `image/${format}`;
  ctx.response.set("content-type", contentType);
  ctx.body = response.data;
};
const storyboard = async (ctx) => {
  const { documentId } = ctx.params;
  const { token, format = "webp" } = ctx.query;
  const extension = ctx.path.endsWith(".json") ? "json" : "vtt";
  let imageUrl = `https://image.mux.com/${documentId}/storyboard.${extension}`;
  const queryParams = new URLSearchParams();
  queryParams.append("format", format);
  if (token) {
    queryParams.append("token", token);
  }
  imageUrl += `?${queryParams.toString()}`;
  const response = await axios__default.default.get(imageUrl, {
    responseType: "stream"
  });
  const contentType = `application/${extension}`;
  ctx.response.set("content-type", contentType);
  ctx.body = response.data;
};
const animated = async (ctx) => {
  const { documentId } = ctx.params;
  const { token, start, end, width, height, fps, format = "gif" } = ctx.query;
  let imageUrl = `https://image.mux.com/${documentId}/animated.${format}`;
  const queryParams = new URLSearchParams();
  if (start !== void 0) {
    queryParams.append("start", start);
  }
  if (end !== void 0) {
    queryParams.append("end", end);
  }
  if (width !== void 0) {
    queryParams.append("width", width);
  }
  if (height !== void 0) {
    queryParams.append("height", height);
  }
  if (fps !== void 0) {
    queryParams.append("fps", fps);
  }
  if (token) {
    queryParams.append("token", token);
  }
  const queryString = queryParams.toString();
  if (queryString) {
    imageUrl += `?${queryString}`;
  }
  const response = await axios__default.default.get(imageUrl, {
    responseType: "stream"
  });
  const contentType = `image/${format}`;
  ctx.response.set("content-type", contentType);
  ctx.body = response.data;
};
async function parseUploadRequest(ctx) {
  const params = parseRequest(ctx, UploadDataWithoutFile, null, null);
  const config2 = UploadConfig.safeParse(params.body);
  if (!config2.success) {
    throw new Error(config2.error.message);
  }
  const { custom_text_tracks = [] } = config2.data;
  const storedTextTracks = await storeTextTracks(custom_text_tracks);
  return {
    storedTextTracks,
    config: config2.data,
    params
  };
}
const postDirectUpload = async (ctx) => {
  const { config: config2, storedTextTracks, params } = await parseUploadRequest(ctx);
  const result = await getService("mux").getDirectUploadUrl({
    config: config2,
    storedTextTracks,
    corsOrigin: ctx.request.header.origin
  });
  const data = {
    title: params.body?.title || "",
    upload_id: result.id,
    ...config2
  };
  await strapi.documents(ASSET_MODEL).create({ data });
  ctx.send(result);
};
const postRemoteUpload = async (ctx) => {
  const { config: config2, storedTextTracks, params } = await parseUploadRequest(ctx);
  if (params.body?.upload_type !== "url" || !params.body.url) {
    ctx.badRequest("ValidationError", { errors: { url: ["url cannot be empty"] } });
    return;
  }
  const result = await getService("mux").createRemoteAsset({ config: config2, storedTextTracks, url: params.body.url });
  const data = {
    asset_id: result.id,
    title: params.body?.title || "",
    url: params.body.url,
    ...config2
  };
  await strapi.documents(ASSET_MODEL).create({ data });
  ctx.send(result);
};
const deleteMuxAsset = async (ctx) => {
  const { params, query } = parseRequest(
    ctx,
    null,
    zod.z.object({ documentId: zod.z.string().or(zod.z.number()) }),
    zod.z.object({ delete_on_mux: zod.z.string().or(zod.z.boolean()).default(true) })
  );
  const muxAsset2 = await strapi.db.query(ASSET_MODEL).findOne({ where: { id: params.documentId } });
  if (!muxAsset2) {
    ctx.notFound("mux-asset.notFound");
    return;
  }
  const deleteRes = await strapi.db.query(ASSET_MODEL).delete({ where: { id: params.documentId } });
  if (!deleteRes) {
    ctx.send({ success: false });
    return;
  }
  const { asset_id, upload_id } = deleteRes;
  const result = { success: true, deletedOnMux: false };
  if (query.delete_on_mux) {
    try {
      const assetId = asset_id !== "" ? asset_id : (await getService("mux").getAssetByUploadId(upload_id)).id;
      const deletedOnMux = await getService("mux").deleteAsset(assetId);
      result.deletedOnMux = deletedOnMux;
    } catch (err) {
    }
  }
  ctx.send(result);
};
const muxWebhookHandler = async (ctx) => {
  const body = ctx.request.body;
  const sigHttpHeader = ctx.request.headers["mux-signature"];
  await getConfig();
  if (sigHttpHeader === void 0 || sigHttpHeader === "" || Array.isArray(sigHttpHeader) && sigHttpHeader.length < 0) {
    ctx.throw(401, "Webhook signature is missing");
  }
  if (Array.isArray(sigHttpHeader) && sigHttpHeader.length > 1) {
    ctx.throw(401, "we have an unexpected amount of signatures");
  }
  if (Array.isArray(sigHttpHeader)) {
    sigHttpHeader[0];
  }
  const outcome = await processWebhookEvent(body);
  if (outcome === void 0) {
    ctx.send("ignored");
  } else {
    const [id, params] = outcome;
    const result = await strapi.db.query(ASSET_MODEL).update({
      where: { id },
      data: params.data
    });
    ctx.send(result);
  }
};
const signMuxPlaybackId = async (ctx) => {
  const { documentId } = ctx.params;
  const { type: type2 } = ctx.query;
  const result = await getService("mux").signPlaybackId(documentId, type2);
  ctx.send(result);
};
const textTrack = async (ctx) => {
  const { documentId } = ctx.params;
  const track = await strapi.db.query(TEXT_TRACK_MODEL).findOne(documentId);
  if (!track) {
    ctx.notFound("mux-text-track.notFound");
    return;
  }
  const contentType = `${track.file.type}; charset=utf-8`;
  ctx.set({ "Content-Type": contentType, "Content-Disposition": `attachment; filename=${track.file.name}` });
  ctx.type = `${track.file.type}; charset=utf-8`;
  ctx.body = track.file.contents;
};
const mux = {
  postDirectUpload,
  postRemoteUpload,
  deleteMuxAsset,
  muxWebhookHandler,
  thumbnail,
  storyboard,
  signMuxPlaybackId,
  textTrack,
  animated
};
const isConfigured = async (ctx) => {
  const { accessTokenId, secretKey, webhookSigningSecret } = await getConfig();
  if (!accessTokenId)
    ctx.send(false);
  else if (!secretKey)
    ctx.send(false);
  else if (!webhookSigningSecret)
    ctx.send(false);
  else
    ctx.send(true);
};
const muxSettings = { isConfigured };
const controllers = {
  "mux-asset": muxAsset,
  mux,
  "mux-settings": muxSettings
};
const middlewares = {};
const policies = {};
const routes$2 = [
  {
    method: "POST",
    path: "/direct-upload",
    handler: "mux.postDirectUpload",
    config: {
      policies: []
    }
  },
  {
    method: "POST",
    path: "/remote-upload",
    handler: "mux.postRemoteUpload",
    config: {
      policies: []
    }
  },
  {
    method: "DELETE",
    path: "/mux-asset/:documentId",
    handler: "mux.deleteMuxAsset",
    config: {
      policies: []
    }
  },
  {
    method: "POST",
    path: "/webhook-handler",
    handler: "mux.muxWebhookHandler",
    config: {
      auth: false
    }
  },
  {
    method: "GET",
    path: "/thumbnail/:documentId",
    handler: "mux.thumbnail",
    config: {
      auth: false,
      description: "Proxies thumbnail requests to load correctly within the Strapi Admin Dashboard"
    }
  },
  {
    method: "GET",
    path: "/storyboard/:documentId",
    handler: "mux.storyboard",
    config: {
      auth: false,
      description: "Proxies storyboard requests to load correctly within the Strapi Admin Dashboard"
    }
  },
  {
    method: "GET",
    path: "/animated/:documentId",
    handler: "mux.animated",
    config: {
      auth: false,
      description: "Proxies animated requests to load correctly within the Strapi Admin Dashboard"
    }
  },
  {
    method: "GET",
    path: "/sign/:documentId",
    handler: "mux.signMuxPlaybackId",
    config: {}
  },
  {
    method: "GET",
    path: "/mux-text-tracks/:documentId",
    handler: "mux.textTrack",
    config: {
      policies: [],
      auth: false
    }
  },
  {
    method: "GET",
    path: "/mux-asset",
    handler: "mux-asset.find",
    config: {
      policies: []
    }
  },
  {
    method: "GET",
    path: "/mux-asset/count",
    handler: "mux-asset.count",
    config: {
      policies: []
    }
  },
  {
    method: "GET",
    path: "/mux-asset/:documentId",
    handler: "mux-asset.findOne",
    config: {
      policies: []
    }
  },
  {
    method: "GET",
    path: "/mux-asset/upload/:uploadId",
    handler: "mux-asset.getByUploadId",
    config: {
      policies: [],
      description: "Get mux assets by asset ID"
    }
  },
  {
    method: "GET",
    path: "/mux-asset/asset/:assetId",
    handler: "mux-asset.getByAssetId",
    config: {
      policies: [],
      description: "Get mux assets by asset ID"
    }
  },
  {
    method: "GET",
    path: "/mux-asset/playback/:playbackId",
    handler: "mux-asset.getByPlaybackId",
    config: {
      policies: [],
      description: "Get mux asset by playback ID"
    }
  },
  {
    method: "POST",
    path: "/mux-asset",
    handler: "mux-asset.create",
    config: {
      policies: []
    }
  },
  {
    method: "PUT",
    path: "/mux-asset/:documentId",
    handler: "mux-asset.update",
    config: {
      policies: []
    }
  },
  {
    method: "DELETE",
    path: "/mux-asset/:documentId",
    handler: "mux-asset.del",
    config: {
      policies: []
    }
  },
  {
    method: "GET",
    path: "/mux-settings",
    handler: "mux-settings.isConfigured",
    config: {
      policies: []
    }
  }
];
const routes$1 = [
  {
    method: "POST",
    path: "/direct-upload",
    handler: "mux.postDirectUpload",
    config: {
      policies: []
    }
  },
  {
    method: "POST",
    path: "/remote-upload",
    handler: "mux.postRemoteUpload",
    config: {
      policies: []
    }
  },
  {
    method: "DELETE",
    path: "/mux-asset/:documentId",
    handler: "mux.deleteMuxAsset",
    config: {
      policies: []
    }
  },
  {
    method: "POST",
    path: "/webhook-handler",
    handler: "mux.muxWebhookHandler",
    config: {
      auth: false
    }
  },
  {
    method: "GET",
    path: "/thumbnail/:documentId",
    handler: "mux.thumbnail",
    config: {
      auth: false,
      description: "Proxies thumbnail requests to load correctly within the Strapi Admin Dashboard"
    }
  },
  {
    method: "GET",
    path: "/storyboard/:documentId",
    handler: "mux.storyboard",
    config: {
      auth: false,
      description: "Proxies storyboard requests to load correctly within the Strapi Admin Dashboard"
    }
  },
  {
    method: "GET",
    path: "/animated/:documentId",
    handler: "mux.animated",
    config: {
      auth: false,
      description: "Proxies animated requests to load correctly within the Strapi Admin Dashboard"
    }
  },
  {
    method: "GET",
    path: "/sign/:documentId",
    handler: "mux.signMuxPlaybackId",
    config: {}
  },
  {
    method: "GET",
    path: "/mux-text-tracks/:documentId",
    handler: "mux.textTrack",
    config: {
      policies: [],
      auth: false
    }
  },
  {
    method: "GET",
    path: "/mux-asset",
    handler: "mux-asset.find",
    config: {
      policies: []
    }
  },
  {
    method: "GET",
    path: "/mux-asset/count",
    handler: "mux-asset.count",
    config: {
      policies: []
    }
  },
  {
    method: "GET",
    path: "/mux-asset/:documentId",
    handler: "mux-asset.findOne",
    config: {
      policies: []
    }
  },
  {
    method: "GET",
    path: "/mux-asset/upload/:uploadId",
    handler: "mux-asset.getByUploadId",
    config: {
      policies: [],
      description: "Get mux assets by asset ID"
    }
  },
  {
    method: "GET",
    path: "/mux-asset/asset/:assetId",
    handler: "mux-asset.getByAssetId",
    config: {
      policies: [],
      description: "Get mux assets by asset ID"
    }
  },
  {
    method: "GET",
    path: "/mux-asset/playback/:playbackId",
    handler: "mux-asset.getByPlaybackId",
    config: {
      policies: [],
      description: "Get mux asset by playback ID"
    }
  },
  {
    method: "POST",
    path: "/mux-asset",
    handler: "mux-asset.create",
    config: {
      policies: []
    }
  },
  {
    method: "PUT",
    path: "/mux-asset/:documentId",
    handler: "mux-asset.update",
    config: {
      policies: []
    }
  },
  {
    method: "DELETE",
    path: "/mux-asset/:documentId",
    handler: "mux-asset.del",
    config: {
      policies: []
    }
  },
  {
    method: "GET",
    path: "/mux-settings",
    handler: "mux-settings.isConfigured",
    config: {
      policies: []
    }
  }
];
const routes = {
  admin: {
    type: "admin",
    routes: routes$2
  },
  "content-api": {
    type: "content-api",
    routes: routes$1
  }
};
const name = "strapi-plugin-mux-video-uploader";
const version = "3.0.1";
const description = "This plugin allows you to upload your content to Mux and use it with Strapi.";
const license = "MIT";
const type = "commonjs";
const strapi$1 = {
  name: "mux-video-uploader",
  displayName: "Mux Video Uploader",
  icon: "plug",
  description: "This plugin allows you to upload your content to Mux and use it with Strapi.",
  kind: "plugin"
};
const author = {
  name: "Erik Peña",
  email: "erikpena@users.noreply.github.com",
  url: "https://github.com/erikpena"
};
const maintainers = [
  {
    name: "Erik Peña",
    email: "erikpena@users.noreply.github.com",
    url: "https://github.com/erikpena"
  }
];
const scripts = {
  build: "strapi-plugin build",
  "test:ts:back": "run -T tsc -p server/tsconfig.json",
  "test:ts:front": "run -T tsc -p admin/tsconfig.json",
  verify: "strapi-plugin verify",
  watch: "strapi-plugin watch",
  "watch:link": "strapi-plugin watch:link",
  preprepare: "husky install"
};
const dependencies = {
  "@mux/mux-node": "^8.8.0",
  "@mux/mux-player-react": "^3.0.0",
  "@mux/upchunk": "^3.4.0",
  "@strapi/design-system": "^2.0.0-rc.11",
  "@strapi/icons": "^2.0.0-rc.11",
  "@strapi/utils": "^4.20.5",
  axios: "^1.7.7",
  "copy-to-clipboard": "^3.3.3",
  formik: "^2.4.6",
  "iso-639-1": "^3.1.3",
  luxon: "^3.5.0",
  "react-intl": "^6.7.0",
  zod: "^3.22.4"
};
const devDependencies = {
  "@strapi/sdk-plugin": "^5.2.6",
  "@strapi/strapi": "^5.0.6",
  "@strapi/typescript-utils": "^5.0.6",
  "@types/luxon": "^3.4.2",
  "@types/react": "^18.3.9",
  "@types/react-dom": "^18.3.0",
  husky: "^9.0.11",
  prettier: "^3.3.3",
  "pretty-quick": "^4.0.0",
  react: "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.26.2",
  "styled-components": "^6.1.13",
  typescript: "^5.6.2"
};
const peerDependencies = {
  "@strapi/sdk-plugin": "^5.2.6",
  "@strapi/strapi": "^5.0.6",
  react: "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.26.2",
  "styled-components": "^6.1.13"
};
const exports$1 = {
  "./package.json": "./package.json",
  "./strapi-admin": {
    types: "./dist/admin/src/index.d.ts",
    source: "./admin/src/index.ts",
    "import": "./dist/admin/index.mjs",
    require: "./dist/admin/index.js",
    "default": "./dist/admin/index.js"
  },
  "./strapi-server": {
    types: "./dist/server/src/index.d.ts",
    source: "./server/src/index.ts",
    "import": "./dist/server/index.mjs",
    require: "./dist/server/index.js",
    "default": "./dist/server/index.js"
  }
};
const files = [
  "dist"
];
const pluginPkg = {
  name,
  version,
  description,
  license,
  type,
  strapi: strapi$1,
  author,
  maintainers,
  scripts,
  dependencies,
  devDependencies,
  peerDependencies,
  exports: exports$1,
  files
};
const getMuxClient = async () => {
  const { accessTokenId, secretKey } = await getConfig();
  return new Mux__default.default({
    tokenId: accessTokenId,
    tokenSecret: secretKey,
    defaultHeaders: {
      "x-source-platform": `Strapi CMS | ${pluginPkg.version}`
    }
  });
};
const muxService = () => ({
  async getAssetById(assetId) {
    const { video } = await getMuxClient();
    return await video.assets.retrieve(assetId);
  },
  async getAssetByUploadId(uploadId) {
    const { video } = await getMuxClient();
    const assets = await video.assets.list({ upload_id: uploadId });
    return assets.data[0];
  },
  async getDirectUploadUrl({
    config: config2,
    storedTextTracks = [],
    corsOrigin = "*"
  }) {
    const { video } = await getMuxClient();
    const encodingTier = config2.video_quality === "basic" ? "baseline" : "smart";
    return video.uploads.create({
      cors_origin: corsOrigin,
      new_asset_settings: {
        input: uploadConfigToNewAssetInput(config2, storedTextTracks),
        playback_policy: [config2.signed ? "signed" : "public"],
        mp4_support: config2.mp4_support,
        encoding_tier: encodingTier,
        max_resolution_tier: config2.max_resolution_tier
      }
    });
  },
  async createRemoteAsset({
    url,
    config: config2,
    storedTextTracks
  }) {
    const { video } = await getMuxClient();
    const encodingTier = config2.video_quality === "basic" ? "baseline" : "smart";
    return video.assets.create({
      input: uploadConfigToNewAssetInput(config2, storedTextTracks, url) || [],
      playback_policy: [config2.signed ? "signed" : "public"],
      mp4_support: config2.mp4_support,
      encoding_tier: encodingTier,
      max_resolution_tier: config2.max_resolution_tier
    });
  },
  async deleteAsset(assetId) {
    const { video } = await getMuxClient();
    await video.assets.delete(assetId);
    return true;
  },
  async signPlaybackId(playbackId, type2) {
    const { jwt } = await getMuxClient();
    const { playbackSigningSecret, playbackSigningId } = await getConfig();
    let baseOptions = {
      keyId: playbackSigningId,
      keySecret: playbackSigningSecret,
      expiration: type2 === "video" ? "1d" : "1m"
    };
    let params = { width: type2 === "thumbnail" ? "512" : "" };
    const token = await jwt.signPlaybackId(playbackId, {
      ...baseOptions,
      // @ts-expect-error This `type` type isn't properly exposed by the Mux SDK
      type: type2,
      params
    });
    return { token };
  },
  async createAssetTextTracks(assetId, tracks) {
    const { video } = await getMuxClient();
    return await Promise.all(tracks.map((track) => video.assets.createTrack(assetId, track)));
  },
  async deleteAssetTextTracks(assetId, trackIds) {
    const { video } = await getMuxClient();
    return await Promise.all(trackIds.map((id) => video.assets.deleteTrack(assetId, id)));
  }
});
const services = {
  mux: muxService
};
const index = {
  register,
  bootstrap,
  destroy,
  config,
  controllers,
  routes,
  services,
  contentTypes,
  policies,
  middlewares
};
module.exports = index;
//# sourceMappingURL=index.js.map
