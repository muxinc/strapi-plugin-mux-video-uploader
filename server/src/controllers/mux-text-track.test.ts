import { validateHeaderValue } from 'node:http';
import { beforeEach, describe, expect, it } from 'vitest';

import { createContext } from '../../../test/koa';
import { FakeStrapi, installFakeStrapi } from '../../../test/strapi';
import { TEXT_TRACK_MODEL } from '../utils/types';
import mux from './mux';

const file = (name: string, contents: string) => ({ name, contents, type: 'text/vtt', size: contents.length });

let fake: FakeStrapi;

beforeEach(() => {
  fake = installFakeStrapi();
  fake.db.seed(TEXT_TRACK_MODEL, [
    {
      id: 1,
      documentId: 'ql0fmxk3d8rjv2c9w5tz1yhe',
      name: 'English',
      language_code: 'en',
      closed_captions: false,
      file: file('en.vtt', 'WEBVTT\n\nenglish'),
    },
    {
      id: 2,
      documentId: 'b7nq4w0zs2kd9xv1mrp6tcfa',
      name: 'French',
      language_code: 'fr',
      closed_captions: false,
      file: file('fr.vtt', 'WEBVTT\n\nfrench'),
    },
  ]);
});

describe('caption files for Mux', () => {
  it('serves the stored track the URL names, not the first one', async () => {
    const ctx = createContext({ params: { documentId: 'b7nq4w0zs2kd9xv1mrp6tcfa' } });

    await mux.textTrack(ctx as any);

    expect(ctx.body).toBe('WEBVTT\n\nfrench');
  });

  it("doesn't serve a track by its numeric id, which could be guessed", async () => {
    const ctx = createContext({ params: { documentId: '2' } });

    await mux.textTrack(ctx as any);

    expect(ctx.status).toBe(404);
  });

  it('names a file with non-Latin characters in a header Node accepts, keeping the real name in filename*', async () => {
    const name = 'Субтитры 日本語 "final" (v2).vtt';
    fake.db.seed(TEXT_TRACK_MODEL, [
      { id: 3, documentId: 'r5m1xk8q2z7w4c0vj9td3nyb', name: 'Russian', file: file(name, 'WEBVTT') },
    ]);
    const ctx = createContext({ params: { documentId: 'r5m1xk8q2z7w4c0vj9td3nyb' } });

    await mux.textTrack(ctx as any);

    const disposition = ctx.responseHeaders['Content-Disposition'];
    expect(() => validateHeaderValue('Content-Disposition', disposition)).not.toThrow();
    expect(disposition).toMatch(/^attachment; filename="[\x20-\x7e]+"; filename\*=UTF-8''[A-Za-z0-9%!._~-]+$/);
    expect(decodeURIComponent(disposition.split("UTF-8''")[1])).toBe(name);
    expect(disposition).toContain('filename="________ ___ _final_ (v2).vtt"');
  });

  it('serves a file whose name has a broken character', async () => {
    fake.db.seed(TEXT_TRACK_MODEL, [
      { id: 4, documentId: 'k2p9wq7x1m4z8c3vj6td0nyr', name: 'Broken', file: file('subs\uD800.vtt', 'WEBVTT') },
    ]);
    const ctx = createContext({ params: { documentId: 'k2p9wq7x1m4z8c3vj6td0nyr' } });

    await mux.textTrack(ctx as any);

    expect(ctx.body).toBe('WEBVTT');
    expect(() => validateHeaderValue('Content-Disposition', ctx.responseHeaders['Content-Disposition'])).not.toThrow();
  });

  it('keeps a plain ASCII name as it is', async () => {
    const ctx = createContext({ params: { documentId: 'b7nq4w0zs2kd9xv1mrp6tcfa' } });

    await mux.textTrack(ctx as any);

    expect(ctx.responseHeaders['Content-Disposition']).toBe(`attachment; filename="fr.vtt"; filename*=UTF-8''fr.vtt`);
  });

  it.each(['3', 'abc', ''])('answers 404 for %j', async (documentId) => {
    const ctx = createContext({ params: { documentId } });

    await mux.textTrack(ctx as any);

    expect(ctx.status).toBe(404);
  });
});
