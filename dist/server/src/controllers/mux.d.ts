import { Context } from 'koa';
declare const _default: {
    postDirectUpload: (ctx: Context) => Promise<void>;
    postRemoteUpload: (ctx: Context) => Promise<void>;
    deleteMuxAsset: (ctx: Context) => Promise<void>;
    muxWebhookHandler: (ctx: Context) => Promise<void>;
    thumbnail: (ctx: Context) => Promise<void>;
    storyboard: (ctx: Context) => Promise<void>;
    signMuxPlaybackId: (ctx: Context) => Promise<void>;
    textTrack: (ctx: Context) => Promise<void>;
};
export default _default;
