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

  it.each(['3', 'abc', ''])('answers 404 for %j', async (documentId) => {
    const ctx = createContext({ params: { documentId } });

    await mux.textTrack(ctx as any);

    expect(ctx.status).toBe(404);
  });
});
