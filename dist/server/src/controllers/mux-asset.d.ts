import { Context } from 'koa';
declare const _default: {
    find: (ctx: Context) => Promise<{
        items: any[];
        totalCount: number;
    }>;
    findOne: (ctx: Context) => Promise<any>;
    count: (ctx: Context) => import("@strapi/types/dist/modules/documents/result/document-engine").Count;
    create: (ctx: Context) => Promise<import("@strapi/types/dist/modules/documents").AnyDocument>;
    update: (ctx: Context) => Promise<{
        ok: boolean;
    }>;
    del: (ctx: Context) => Promise<{
        documentId: string;
        entries: import("@strapi/types/dist/modules/documents").AnyDocument[];
    }>;
    getByAssetId: (ctx: Context) => Promise<any>;
    getByPlaybackId: (ctx: Context) => Promise<any>;
};
export default _default;
