declare const _default: {
    "mux-asset": {
        index: (ctx: import("koa").Context) => Promise<void>;
        find: (ctx: import("koa").Context) => Promise<{
            items: any;
            totalCount: any;
        }>;
        findOne: (ctx: import("koa").Context) => Promise<any>;
        count: (ctx: import("koa").Context) => any;
        create: (ctx: import("koa").Context) => Promise<any>;
        update: (ctx: import("koa").Context) => Promise<any>;
        del: (ctx: import("koa").Context) => Promise<any>;
    };
    "mux-settings": {
        isConfiged: (ctx: import("koa").Context) => Promise<void>;
        clearConfig: (ctx: import("koa").Context) => Promise<void>;
        saveConfig: (ctx: import("koa").Context) => Promise<void>;
    };
    mux: {
        index: (ctx: import("koa").Context) => Promise<any>;
        submitDirectUpload: (ctx: import("koa").Context) => Promise<void>;
        submitRemoteUpload: (ctx: import("koa").Context) => Promise<void>;
        deleteMuxAsset: (ctx: import("koa").Context) => Promise<void>;
        muxWebhookHandler: (ctx: import("koa").Context) => Promise<void>;
    };
};
export = _default;
