import { beforeEach, describe, expect, it, vi } from 'vitest';

import { unixNow } from '../../../test/fixtures';
import { createContext, HttpError, signWebhook, webhookContext } from '../../../test/koa';
import { FakeStrapi, installFakeStrapi } from '../../../test/strapi';
import services from '../services';
import { dispatchWebhookEvent } from '../webhooks';
import mux from './mux';

vi.mock('../webhooks', () => ({ dispatchWebhookEvent: vi.fn(async () => 'handled') }));

const event = { type: 'video.asset.ready', id: 'evt_1', data: { id: 'ast_1', status: 'ready' } };

let fake: FakeStrapi;

beforeEach(() => {
  fake = installFakeStrapi({ services });
});

const handle = (ctx: Record<string, any>) => mux.muxWebhookHandler(ctx as any);

describe('webhook route', () => {
  it('answers 200 to a correctly signed event and hands the parsed event to the dispatcher', async () => {
    const ctx = webhookContext(event);

    await handle(ctx);

    expect(ctx.status).toBe(200);
    expect(ctx.body).toBe('handled');
    expect(dispatchWebhookEvent).toHaveBeenCalledWith(event);
  });

  it('answers 200 to a verified event nothing handles', async () => {
    vi.mocked(dispatchWebhookEvent).mockResolvedValueOnce('ignored');
    const ctx = webhookContext({ ...event, type: 'video.live_stream.idle' });

    await handle(ctx);

    expect(ctx.status).toBe(200);
    expect(ctx.body).toBe('ignored');
  });

  it('answers 401 and writes nothing when the body was changed after signing', async () => {
    const ctx = webhookContext(event, {
      rawBody: JSON.stringify({ ...event, data: { id: 'ast_someone_elses', status: 'ready' } }),
    });

    await expect(handle(ctx)).rejects.toMatchObject({ status: 401 });
    expect(dispatchWebhookEvent).not.toHaveBeenCalled();
    expect(fake.log.warn).toHaveBeenCalledWith(expect.stringContaining('Webhook rejected'));
  });

  it('answers 401 when the signature header is missing', async () => {
    const ctx = webhookContext(event, { headers: {} });

    await expect(handle(ctx)).rejects.toMatchObject({ status: 401 });
    expect(dispatchWebhookEvent).not.toHaveBeenCalled();
  });

  it('answers 401 when the event was signed with another secret', async () => {
    const ctx = webhookContext(event, { secret: 'someone-elses-secret' });

    await expect(handle(ctx)).rejects.toMatchObject({ status: 401 });
    expect(dispatchWebhookEvent).not.toHaveBeenCalled();
  });

  it('answers 401 when the signature is more than 5 minutes old', async () => {
    const ctx = webhookContext(event, { timestamp: unixNow() - 301 });

    await expect(handle(ctx)).rejects.toMatchObject({ status: 401 });
    expect(dispatchWebhookEvent).not.toHaveBeenCalled();
  });

  it("answers 401 to every event while the signing secret is empty, naming the plugin's setting", async () => {
    fake = installFakeStrapi({ services, config: { webhookSigningSecret: '' } });
    const ctx = webhookContext(event, { secret: '' });

    await expect(handle(ctx)).rejects.toMatchObject({ status: 401 });
    expect(dispatchWebhookEvent).not.toHaveBeenCalled();
    expect(fake.log.warn).toHaveBeenCalledTimes(1);
    expect(fake.log.warn).toHaveBeenCalledWith(expect.stringContaining('webhookSigningSecret is empty'));
    expect(fake.log.warn).not.toHaveBeenCalledWith(expect.stringContaining('MUX_WEBHOOK_SECRET'));
  });

  it('answers 500 and says how to fix it when the raw body is unavailable', async () => {
    const rawBody = JSON.stringify(event);
    const ctx = createContext({
      body: event,
      headers: { 'content-type': 'application/json', 'mux-signature': signWebhook(rawBody) },
    });

    await expect(handle(ctx)).rejects.toMatchObject({ status: 500 });
    expect(dispatchWebhookEvent).not.toHaveBeenCalled();
    expect(fake.log.error).toHaveBeenCalledWith(expect.stringContaining('includeUnparsed: true'));
  });

  it("answers 415 to a request that isn't JSON, without blaming the configuration", async () => {
    const ctx = createContext({ body: 'hello', headers: { 'content-type': 'text/plain' } });

    await expect(handle(ctx)).rejects.toMatchObject({ status: 415 });
    expect(dispatchWebhookEvent).not.toHaveBeenCalled();
    expect(fake.log.error).not.toHaveBeenCalled();
  });

  it('answers 500 when writing the event fails, so Mux delivers it again', async () => {
    vi.mocked(dispatchWebhookEvent).mockRejectedValueOnce(new Error('database is locked'));
    const ctx = webhookContext(event);

    const error = await handle(ctx).catch((thrown) => thrown);

    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(500);
    expect(fake.log.error).toHaveBeenCalledWith(expect.stringContaining('database is locked'));
  });
});
