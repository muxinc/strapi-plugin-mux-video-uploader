declare const _default: () => {
    bootstrap: ({ strapi }: {
        strapi: any;
    }) => Promise<void>;
    routes: {
        method: string;
        path: string;
        handler: string;
        config: {
            policies: never[];
            prefix: boolean;
        };
    }[];
    controllers: {
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
    contentTypes: {
        "mux-asset": {
            schema: {
                kind: string;
                collectionName: string;
                info: {
                    name: string;
                    description: string;
                    displayName: string;
                    singularName: string;
                    pluralName: string;
                };
                pluginOptions: {
                    "content-manager": {
                        visible: boolean;
                    };
                    "content-type-builder": {
                        visible: boolean;
                    };
                };
                options: {
                    increments: boolean;
                    timestamps: boolean;
                };
                attributes: {
                    title: {
                        type: string;
                        private: boolean;
                        required: boolean;
                        maxLength: number;
                        minLength: number;
                    };
                    upload_id: {
                        type: string;
                        required: boolean;
                        maxLength: number;
                    };
                    asset_id: {
                        type: string;
                        required: boolean;
                        maxLength: number;
                    };
                    playback_id: {
                        type: string;
                        required: boolean;
                        maxLength: number;
                    };
                    error_message: {
                        type: string;
                        required: boolean;
                        maxLength: number;
                    };
                    isReady: {
                        type: string;
                        default: boolean;
                        required: boolean;
                    };
                };
            };
        };
    };
    services: {
        mux: ({ strapi }: {
            strapi: any;
        }) => {
            getAssetIdByUploadId(uploadId: string): Promise<any>;
            getDirectUploadUrl(corsOrigin?: string): Promise<any>;
            createAsset(url: string): Promise<any>;
            deleteAsset(assetId: string): Promise<boolean>;
        };
    };
};
export = _default;
