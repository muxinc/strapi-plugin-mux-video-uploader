/// <reference types="koa" />
declare const _default: {
    register: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => void;
    bootstrap: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => Promise<void>;
    destroy: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => void;
    config: {
        default: {
            accessTokenId: string;
            secretKey: string;
            webhookSigningSecret: string;
            playbackSigningId: string;
            playbackSigningSecret: string;
        };
        validator(config: import("./utils/config").Config): void;
    };
    controllers: {
        'mux-asset': {
            find: (ctx: import("koa").Context) => Promise<{
                items: any[];
                totalCount: number;
            }>;
            findOne: (ctx: import("koa").Context) => Promise<any>;
            count: (ctx: import("koa").Context) => import("@strapi/types/dist/modules/documents/result/document-engine").Count;
            create: (ctx: import("koa").Context) => Promise<import("@strapi/types/dist/modules/documents").AnyDocument>;
            update: (ctx: import("koa").Context) => Promise<{
                ok: boolean;
            }>;
            del: (ctx: import("koa").Context) => Promise<{
                documentId: string;
                entries: import("@strapi/types/dist/modules/documents").AnyDocument[];
            }>;
            getByAssetId: (ctx: import("koa").Context) => Promise<any>;
            getByPlaybackId: (ctx: import("koa").Context) => Promise<any>;
        };
        mux: {
            postDirectUpload: (ctx: import("koa").Context) => Promise<void>;
            postRemoteUpload: (ctx: import("koa").Context) => Promise<void>;
            deleteMuxAsset: (ctx: import("koa").Context) => Promise<void>;
            muxWebhookHandler: (ctx: import("koa").Context) => Promise<void>;
            thumbnail: (ctx: import("koa").Context) => Promise<void>;
            storyboard: (ctx: import("koa").Context) => Promise<void>;
            signMuxPlaybackId: (ctx: import("koa").Context) => Promise<void>;
            textTrack: (ctx: import("koa").Context) => Promise<void>;
            animated: (ctx: import("koa").Context) => Promise<void>;
        };
        'mux-settings': {
            isConfigured: (ctx: import("koa").Context) => Promise<void>;
        };
    };
    routes: {
        admin: {
            type: string;
            routes: ({
                method: string;
                path: string;
                handler: string;
                config: {
                    policies: any[];
                    auth?: undefined;
                    description?: undefined;
                };
            } | {
                method: string;
                path: string;
                handler: string;
                config: {
                    auth: boolean;
                    policies?: undefined;
                    description?: undefined;
                };
            } | {
                method: string;
                path: string;
                handler: string;
                config: {
                    auth: boolean;
                    description: string;
                    policies?: undefined;
                };
            } | {
                method: string;
                path: string;
                handler: string;
                config: {
                    policies?: undefined;
                    auth?: undefined;
                    description?: undefined;
                };
            } | {
                method: string;
                path: string;
                handler: string;
                config: {
                    policies: any[];
                    auth: boolean;
                    description?: undefined;
                };
            } | {
                method: string;
                path: string;
                handler: string;
                config: {
                    policies: any[];
                    description: string;
                    auth?: undefined;
                };
            })[];
        };
        'content-api': {
            type: string;
            routes: ({
                method: string;
                path: string;
                handler: string;
                config: {
                    policies: any[];
                    auth: boolean;
                    description?: undefined;
                };
            } | {
                method: string;
                path: string;
                handler: string;
                config: {
                    auth: boolean;
                    policies?: undefined;
                    description?: undefined;
                };
            } | {
                method: string;
                path: string;
                handler: string;
                config: {
                    auth: boolean;
                    description: string;
                    policies?: undefined;
                };
            } | {
                method: string;
                path: string;
                handler: string;
                config: {
                    policies?: undefined;
                    auth?: undefined;
                    description?: undefined;
                };
            } | {
                method: string;
                path: string;
                handler: string;
                config: {
                    policies: any[];
                    auth?: undefined;
                    description?: undefined;
                };
            } | {
                method: string;
                path: string;
                handler: string;
                config: {
                    policies: any[];
                    description: string;
                    auth?: undefined;
                };
            })[];
        };
    };
    services: {
        mux: () => {
            getAssetById(assetId: string): Promise<import("@mux/mux-node/resources/video/assets").Asset>;
            getAssetByUploadId(uploadId: string): Promise<import("@mux/mux-node/resources/video/assets").Asset>;
            getDirectUploadUrl({ config, storedTextTracks, corsOrigin, }: {
                config: {
                    mp4_support?: "none" | "standard";
                    max_resolution_tier?: "2160p" | "1440p" | "1080p";
                    video_quality?: "basic" | "plus";
                    signed?: boolean;
                    autogenerated_captions_languages?: {
                        code?: "en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg";
                        isSourceLanguage?: boolean;
                    }[];
                    custom_text_tracks?: {
                        name?: string;
                        file?: {
                            type?: string;
                            contents?: string;
                            name?: string;
                            size?: number;
                        };
                        language_code?: string;
                        closed_captions?: boolean;
                        stored_track?: import("@mux/mux-node/resources/video/assets").Track;
                    }[];
                    upload_type?: "file" | "url";
                };
                storedTextTracks: import("../../types/shared-types").StoredTextTrack[];
                corsOrigin?: string;
            }): Promise<import("@mux/mux-node/resources/video/uploads").Upload>;
            createRemoteAsset({ url, config, storedTextTracks, }: {
                url: string;
                storedTextTracks: import("../../types/shared-types").StoredTextTrack[];
                config: {
                    mp4_support?: "none" | "standard";
                    max_resolution_tier?: "2160p" | "1440p" | "1080p";
                    video_quality?: "basic" | "plus";
                    signed?: boolean;
                    autogenerated_captions_languages?: {
                        code?: "en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg";
                        isSourceLanguage?: boolean;
                    }[];
                    custom_text_tracks?: {
                        name?: string;
                        file?: {
                            type?: string;
                            contents?: string;
                            name?: string;
                            size?: number;
                        };
                        language_code?: string;
                        closed_captions?: boolean;
                        stored_track?: import("@mux/mux-node/resources/video/assets").Track;
                    }[];
                    upload_type?: "file" | "url";
                };
            }): Promise<import("@mux/mux-node/resources/video/assets").Asset>;
            deleteAsset(assetId: string): Promise<boolean>;
            signPlaybackId(playbackId: string, type: string): Promise<{
                token: string;
            }>;
            createAssetTextTracks(assetId: string, tracks: import("@mux/mux-node/resources/video/assets").AssetCreateTrackParams[]): Promise<import("@mux/mux-node/resources/video/assets").Track[]>;
            deleteAssetTextTracks(assetId: string, trackIds: string[]): Promise<void[]>;
        };
    };
    contentTypes: {
        'mux-asset': {
            schema: {
                kind: string;
                collectionName: string;
                info: {
                    description: string;
                    displayName: string;
                    singularName: string;
                    pluralName: string;
                };
                pluginOptions: {
                    'content-manager': {
                        visible: boolean;
                    };
                    'content-type-builder': {
                        visible: boolean;
                    };
                };
                options: {
                    draftAndPublish: boolean;
                };
                attributes: {
                    title: {
                        type: string;
                        private: boolean;
                        required: boolean;
                        maxLength: number;
                        minLength: number;
                        configurable: boolean;
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
                    signed: {
                        type: string;
                        default: boolean;
                        required: boolean;
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
                    duration: {
                        type: string;
                        required: boolean;
                    };
                    aspect_ratio: {
                        type: string;
                        required: boolean;
                    };
                    asset_data: {
                        type: string;
                    };
                };
            };
        };
        /**
         * Plugin server methods
         */
        'mux-text-track': {
            schema: {
                kind: string;
                collectionName: string;
                info: {
                    description: string;
                    displayName: string;
                    singularName: string;
                    pluralName: string;
                };
                pluginOptions: {
                    'content-manager': {
                        visible: boolean;
                    };
                    'content-type-builder': {
                        visible: boolean;
                    };
                };
                options: {
                    draftAndPublish: boolean;
                };
                attributes: {
                    name: {
                        type: string;
                        private: boolean;
                        required: boolean;
                    };
                    language_code: {
                        type: string;
                        private: boolean;
                        required: boolean;
                    };
                    closed_captions: {
                        type: string;
                        private: boolean;
                        required: boolean;
                    };
                    file: {
                        type: string;
                        private: boolean;
                        required: boolean;
                    };
                };
            };
        };
    };
    policies: {};
    middlewares: {};
};
export default _default;
