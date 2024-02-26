import { Context } from 'koa';

export function parseJSONBody<S extends Zod.Schema>(ctx: Context, bodySchema: S): Zod.infer<S> {
  const { body } = ctx.request;

  let bodyObject = (() => {
    if (body && typeof body === 'object') {
      return body;
    }

    try {
      return JSON.parse(body);
    } catch (error) {
      // @ts-expect-error
      ctx.badRequest('InvalidBody', { errors: { body: 'invalid body' } });
      throw new Error('invalid-body');
    }
  })();

  const result = bodySchema.safeParse(bodyObject);

  if (!result.success) {
    // @ts-expect-error
    ctx.badRequest('ValidationError', { errors: { body: result.error.message } });
    throw new Error(result.error.message);
  }

  return result.data;
}
