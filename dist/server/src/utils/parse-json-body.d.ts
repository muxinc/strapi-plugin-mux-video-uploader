import { Context } from 'koa';
interface ParsedRequest<BodySchema extends Zod.Schema, ParamsSchema extends Zod.Schema, QuerySchema extends Zod.Schema> {
    body?: Zod.infer<BodySchema>;
    params?: Zod.infer<ParamsSchema>;
    query?: Zod.infer<QuerySchema>;
}
export declare function parseRequest<BS extends Zod.Schema, PS extends Zod.Schema, QS extends Zod.Schema>(ctx: Context, bodySchema: BS, paramsSchema: PS, querySchema: QS): ParsedRequest<BS, PS, QS>;
export {};
