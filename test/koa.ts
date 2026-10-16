import { createHmac } from 'node:crypto';

import { DEFAULT_PLUGIN_CONFIG } from './strapi';

/** Where koa-body keeps the raw body when `strapi::body` has `includeUnparsed`. */
const UNPARSED_BODY = Symbol.for('unparsedBody');

export interface ContextInit {
  body?: unknown;
  /** Stored under `UNPARSED_BODY` on the parsed body, as koa-body does. */
  rawBody?: string;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  state?: Record<string, unknown>;
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message?: string
  ) {
    super(message ?? String(status));
  }
}

/** Enough of a Koa context, with Strapi's response helpers, for the plugin's controllers. */
export function createContext(init: ContextInit = {}) {
  const headers = init.headers ?? {};
  const body =
    init.rawBody === undefined
      ? init.body
      : Object.assign((init.body as object | undefined) ?? {}, { [UNPARSED_BODY]: init.rawBody });

  const ctx: Record<string, any> = {
    params: init.params ?? {},
    query: init.query ?? {},
    state: init.state ?? {},
    headers,
    request: { body, headers, header: headers },
    status: 404,
    body: undefined,
    set: () => undefined,
    /** Koa's `ctx.is`, for the request's `content-type` only. */
    is(type: string) {
      return String(headers['content-type'] ?? '').includes(type) ? type : false;
    },
    throw(status: number, message?: string): never {
      throw new HttpError(status, message);
    },
    send(responseBody: unknown, status = 200) {
      ctx.status = status;
      ctx.body = responseBody;
    },
    badRequest(message: string, details?: unknown) {
      ctx.status = 400;
      ctx.body = { error: { status: 400, name: 'BadRequestError', message, details } };
    },
    notFound(message?: string) {
      ctx.status = 404;
      ctx.body = { error: { status: 404, name: 'NotFoundError', message } };
    },
    forbidden(message?: string) {
      ctx.status = 403;
      ctx.body = { error: { status: 403, name: 'ForbiddenError', message } };
    },
  };

  return ctx;
}

export const signWebhook = (
  rawBody: string,
  { secret = DEFAULT_PLUGIN_CONFIG.webhookSigningSecret, timestamp = Math.floor(Date.now() / 1000) } = {}
) => `t=${timestamp},v1=${createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')}`;

/** A context for the webhook route, signed the way Mux signs it unless told otherwise. */
export function webhookContext(
  event: unknown,
  options: { rawBody?: string; headers?: Record<string, string>; secret?: string; timestamp?: number } = {}
) {
  const signedBody = JSON.stringify(event);
  const rawBody = options.rawBody ?? signedBody;
  const headers = options.headers ?? {
    'content-type': 'application/json',
    'mux-signature': signWebhook(signedBody, options),
  };

  return createContext({ body: JSON.parse(rawBody), rawBody, headers });
}
