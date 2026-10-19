import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createContext } from '../../../test/koa';
import { FakeStrapi, installFakeStrapi } from '../../../test/strapi';
import robots from './robots';

const ARTICLE = 'api::article.article';

const articleType = {
  attributes: {
    title: { type: 'string' },
    video: { type: 'relation', relation: 'oneToOne', target: 'plugin::mux-video-uploader.mux-asset' },
    author: { type: 'relation', relation: 'oneToOne', target: 'api::author.author' },
  },
};

const summary = { job_id: 'rjob_1', title: 'Generated', description: 'Described', tags: ['a'] };

let fake: FakeStrapi;
let canRead: ReturnType<typeof vi.fn>;
let findOne: ReturnType<typeof vi.fn>;

beforeEach(() => {
  canRead = vi.fn(() => true);
  findOne = vi.fn(async () => ({
    documentId: 'doc_1',
    video: { id: 4, title: 'A video', asset_id: 'ast_1', robots_outputs: { summarize: summary } },
  }));
  fake = installFakeStrapi({
    pluginServices: {
      'content-manager': {
        'permission-checker': {
          create: () => ({
            can: { read: (...args: unknown[]) => canRead(...args) },
            cannot: { read: (...args: unknown[]) => !canRead(...args) },
          }),
        },
      },
    },
  });
  fake.strapi.contentType = vi.fn((uid: string) => (uid === ARTICLE ? articleType : undefined));
  fake.strapi.documents = vi.fn(() => ({ findOne }));
});

const request = (query: Record<string, string>) => createContext({ query, state: { userAbility: {} } });

describe('entry videos for Apply summary', () => {
  it("returns each Mux relation's videos with their newest summary, from the saved draft", async () => {
    const ctx = request({ model: ARTICLE, documentId: 'doc_1', locale: 'fr' });

    await robots.entryVideos(ctx as any);

    expect(findOne).toHaveBeenCalledWith({
      documentId: 'doc_1',
      locale: 'fr',
      status: 'draft',
      populate: { video: true, createdBy: { fields: ['id'] } },
    });
    expect(ctx.body).toEqual({
      fields: [{ name: 'video', videos: [{ id: 4, title: 'A video', asset_id: 'ast_1', summary }] }],
    });
  });

  it('reads the published version when asked to', async () => {
    const ctx = request({ model: ARTICLE, documentId: 'doc_1', status: 'published' });

    await robots.entryVideos(ctx as any);

    expect(findOne).toHaveBeenCalledWith(expect.objectContaining({ documentId: 'doc_1', status: 'published' }));
    expect(ctx.body.fields[0].videos).toHaveLength(1);
  });

  it('reads the draft when asked to', async () => {
    const ctx = request({ model: ARTICLE, documentId: 'doc_1', status: 'draft' });

    await robots.entryVideos(ctx as any);

    expect(findOne).toHaveBeenCalledWith(expect.objectContaining({ status: 'draft' }));
  });

  it('answers 400 to any other status, without reading the entry', async () => {
    const ctx = request({ model: ARTICLE, documentId: 'doc_1', status: 'modified' });

    await robots.entryVideos(ctx as any);

    expect(ctx.status).toBe(400);
    expect(findOne).not.toHaveBeenCalled();
  });

  it("answers 403 to someone who can't read that content type", async () => {
    canRead.mockReturnValue(false);
    const ctx = request({ model: ARTICLE, documentId: 'doc_1' });

    await robots.entryVideos(ctx as any);

    expect(ctx.status).toBe(403);
    expect(findOne).not.toHaveBeenCalled();
  });

  it("leaves out a Mux relation the role isn't allowed to read, without loading it", async () => {
    canRead.mockImplementation((_entity?: unknown, field?: string) => field !== 'video');
    const ctx = request({ model: ARTICLE, documentId: 'doc_1' });

    await robots.entryVideos(ctx as any);

    expect(ctx.body).toEqual({ fields: [] });
    expect(findOne).not.toHaveBeenCalled();
  });

  it('lets a role that reads only its own entries see the videos of the ones it created', async () => {
    const own = (entity?: { createdBy?: { id?: number } } | null) => !entity || entity.createdBy?.id === 3;
    canRead.mockImplementation(own);
    findOne.mockResolvedValueOnce({
      documentId: 'doc_1',
      createdBy: { id: 3 },
      video: { id: 4, title: 'A video', asset_id: 'ast_1', robots_outputs: { summarize: summary } },
    });

    const mine = request({ model: ARTICLE, documentId: 'doc_1' });
    await robots.entryVideos(mine as any);
    expect(mine.body.fields[0].videos).toHaveLength(1);

    findOne.mockResolvedValueOnce({ documentId: 'doc_2', createdBy: { id: 5 }, video: null });
    const theirs = request({ model: ARTICLE, documentId: 'doc_2' });
    await robots.entryVideos(theirs as any);
    expect(theirs.status).toBe(403);
  });

  it('answers with no fields for a content type without Mux relations', async () => {
    fake.strapi.contentType = vi.fn(() => ({ attributes: { name: { type: 'string' } } }));
    const ctx = request({ model: 'api::category.category', documentId: 'doc_2' });

    await robots.entryVideos(ctx as any);

    expect(ctx.body).toEqual({ fields: [] });
  });

  it('answers 400 without a model or a document', async () => {
    const ctx = request({ model: ARTICLE });

    await robots.entryVideos(ctx as any);

    expect(ctx.status).toBe(400);
  });
});
