import { Context } from 'koa';
declare const _default: {
    index: (ctx: Context) => Promise<void>;
    find: (ctx: Context) => Promise<{
        items: any;
        totalCount: any;
    }>;
    findOne: (ctx: Context) => Promise<any>;
    count: (ctx: Context) => any;
    create: (ctx: Context) => Promise<any>;
    update: (ctx: Context) => Promise<any>;
    del: (ctx: Context) => Promise<any>;
};
export = _default;
