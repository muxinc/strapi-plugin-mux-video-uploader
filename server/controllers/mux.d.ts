import { Context } from 'koa';
declare const _default: {
    index: (ctx: Context) => Promise<any>;
    submitDirectUpload: (ctx: Context) => Promise<void>;
    submitRemoteUpload: (ctx: Context) => Promise<void>;
    deleteMuxAsset: (ctx: Context) => Promise<void>;
    muxWebhookHandler: (ctx: Context) => Promise<void>;
};
export = _default;
