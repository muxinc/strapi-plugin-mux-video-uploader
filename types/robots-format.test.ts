import { describe, expect, it } from 'vitest';

import {
  blocksParagraph,
  buildApplyRows,
  defaultTargets,
  EntryFieldOption,
  isEmptyFieldValue,
  matchesGeneratedValue,
  minLengthProblem,
  muxAssetRelationFields,
  plainTextOf,
  truncateAtWord,
  valueForField,
} from './robots-format';

describe('truncateAtWord', () => {
  it('keeps text that fits as it is', () => {
    const title = `${'word '.repeat(50)}abcd`;

    expect(title).toHaveLength(254);
    expect(truncateAtWord(title, 255)).toBe(title);
  });

  it('cuts longer text at the last space before the limit and adds an ellipsis', () => {
    const title = truncateAtWord('lorem '.repeat(60).trim(), 255);

    expect(title).toHaveLength(252);
    expect(title.endsWith('lorem…')).toBe(true);
    expect(truncateAtWord('A walkthrough of uploading and encoding video', 20)).toBe('A walkthrough of…');
  });

  it('cuts a single long word where it must', () => {
    expect(truncateAtWord('x'.repeat(300), 255)).toBe(`${'x'.repeat(254)}…`);
  });
});

describe('Apply summary mapping', () => {
  const fields: EntryFieldOption[] = [
    { name: 'name', label: 'Name', type: 'string' },
    { name: 'title', label: 'Title', type: 'string' },
    { name: 'seoTitle', label: 'SEO title', type: 'string', maxLength: 60 },
    { name: 'Description', label: 'Description', type: 'text' },
    { name: 'body', label: 'Body', type: 'blocks' },
    { name: 'tags', label: 'Tags', type: 'json' },
    { name: 'views', label: 'Views', type: 'integer' },
  ];
  const summary = {
    title: 'Building a video pipeline with Mux',
    description:
      'A walkthrough of uploading, encoding and playing video with Mux, from the first upload to the last frame.',
    tags: ['video', 'mux'],
  };
  const field = (name: string) => fields.find((candidate) => candidate.name === name)!;

  it('proposes fields by name, most specific first and ignoring case, or the first compatible one', () => {
    const rows = buildApplyRows(summary, fields);

    expect(rows.map((row) => [row.key, row.suggested?.name])).toEqual([
      ['title', 'title'],
      ['description', 'Description'],
      ['tags', 'tags'],
    ]);
    expect(buildApplyRows(summary, [field('body')])[0].suggested?.name).toBe('body');
  });

  it('only offers JSON fields for tags, and text fields for the rest', () => {
    const [title, , tags] = buildApplyRows(summary, fields);

    expect(title.compatible.map((candidate) => candidate.name)).toEqual([
      'name',
      'title',
      'seoTitle',
      'Description',
      'body',
    ]);
    expect(tags.compatible.map((candidate) => candidate.name)).toEqual(['tags']);
    expect(valueForField(summary.tags, field('tags'))).toEqual(['video', 'mux']);
  });

  it('offers a field restricted to one output for that output only', () => {
    const own: EntryFieldOption[] = [
      { name: 'title', label: 'Title', type: 'string', maxLength: 255, minLength: 3, onlyFor: 'title' },
      { name: 'description', label: 'Description', type: 'text', onlyFor: 'description' },
      { name: 'tags', label: 'Tags', type: 'json', onlyFor: 'tags' },
    ];
    const rows = buildApplyRows(summary, own);

    expect(rows.map((row) => [row.key, row.compatible.map((candidate) => candidate.name)])).toEqual([
      ['title', ['title']],
      ['description', ['description']],
      ['tags', ['tags']],
    ]);
    expect(defaultTargets(rows, { title: 'A video', description: '', tags: [] })).toEqual({
      title: '',
      description: 'description',
      tags: 'tags',
    });
  });

  it('skips outputs the summary has no value for', () => {
    expect(buildApplyRows({ title: 'Only a title' }, fields).map((row) => row.key)).toEqual(['title']);
    expect(buildApplyRows(null, fields)).toEqual([]);
  });

  it('pre-selects a field only while it is empty, and each field for one row at most', () => {
    const rows = buildApplyRows(summary, fields);

    expect(defaultTargets(rows, {})).toEqual({ title: 'title', description: 'Description', tags: 'tags' });
    expect(defaultTargets(rows, { title: 'Mine', tags: [] })).toEqual({
      title: '',
      description: 'Description',
      tags: 'tags',
    });

    const sameField = buildApplyRows(summary, [field('body')]);
    expect(defaultTargets(sameField, {})).toEqual({ title: 'body', description: '', tags: '' });
  });

  it('writes blocks as a single paragraph', () => {
    expect(valueForField('Hello', field('body'))).toEqual([
      { type: 'paragraph', children: [{ type: 'text', text: 'Hello' }] },
    ]);
  });

  it("cuts text to the field's maxLength on a word boundary, 255 for a string without one", () => {
    const cut = valueForField(summary.description, field('seoTitle')) as string;

    expect(cut.length).toBeLessThanOrEqual(60);
    expect(cut).toBe('A walkthrough of uploading, encoding and playing video with…');
    expect(valueForField('x '.repeat(200), field('title'))).toHaveLength(254);
    expect(valueForField(summary.description, field('Description'))).toBe(summary.description);
  });

  it('refuses a row whose value is shorter than the field allows', () => {
    const strict: EntryFieldOption = { name: 'headline', label: 'Headline', type: 'string', minLength: 50 };

    expect(minLengthProblem('Short', strict)).toBe('Headline needs at least 50 characters; the generated text has 5.');
    expect(defaultTargets(buildApplyRows({ title: 'Short' }, [strict]), {})).toEqual({ title: '' });
  });

  it('tells content that is already this summary from content it would replace', () => {
    expect(matchesGeneratedValue('Building a video pipeline with Mux', summary.title, field('title'))).toBe(true);
    expect(matchesGeneratedValue(blocksParagraph(summary.title), summary.title, field('body'))).toBe(true);
    expect(matchesGeneratedValue(['video', 'mux'], summary.tags, field('tags'))).toBe(true);
    expect(matchesGeneratedValue('Something else', summary.title, field('title'))).toBe(false);
    expect(matchesGeneratedValue('', summary.title, field('title'))).toBe(false);
  });

  it('reads current values as plain text for the preview, and empty blocks as empty', () => {
    expect(plainTextOf(blocksParagraph('One'))).toBe('One');
    expect(plainTextOf(['a', 'b'])).toBe('a, b');
    expect(isEmptyFieldValue([{ type: 'paragraph', children: [{ type: 'text', text: '' }] }])).toBe(true);
    expect(isEmptyFieldValue('  ')).toBe(true);
    expect(isEmptyFieldValue('x')).toBe(false);
  });

  it('finds the top-level relations to Mux assets', () => {
    expect(
      muxAssetRelationFields({
        video: { type: 'relation', target: 'plugin::mux-video-uploader.mux-asset' },
        author: { type: 'relation', target: 'api::author.author' },
        title: { type: 'string' },
      })
    ).toEqual(['video']);
  });
});
