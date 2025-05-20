import { Context } from 'koa';
import { ZodType, infer as ZodInfer } from 'zod';
interface ParsedRequest<BodySchema extends ZodType<any>, ParamsSchema extends ZodType<any>, QuerySchema extends ZodType<any>> {
    body?: ZodInfer<BodySchema>;
    params?: ZodInfer<ParamsSchema>;
    query?: ZodInfer<QuerySchema>;
}
export declare function parseRequest<BS extends ZodType<any>, PS extends ZodType<any>, QS extends ZodType<any>>(ctx: Context, bodySchema: BS | null, paramsSchema: PS | null, querySchema: QS | null): ParsedRequest<BS, PS, QS>;
export {};
