import { describe, expect, it } from 'vitest';

import { toAssetTitle, truncateAtWord } from './robots-format';

describe('toAssetTitle', () => {
  it('trims and collapses whitespace', () => {
    expect(toAssetTitle('  Building   a video\n pipeline  ')).toBe('Building a video pipeline');
  });

  it('keeps a title of up to 255 characters as it is', () => {
    const title = `${'word '.repeat(50)}abcd`;

    expect(title).toHaveLength(254);
    expect(toAssetTitle(title)).toBe(title);
  });

  it('cuts a longer title at the last space before 254 characters and adds an ellipsis', () => {
    const title = toAssetTitle('lorem '.repeat(60));

    expect(title).toHaveLength(252);
    expect(title!.endsWith('lorem…')).toBe(true);
    expect(title!.length).toBeLessThanOrEqual(255);
  });

  it('cuts a single long word where it must', () => {
    expect(toAssetTitle('x'.repeat(300))).toBe(`${'x'.repeat(254)}…`);
  });

  it('returns null for anything shorter than 3 characters', () => {
    expect(toAssetTitle('  ok ')).toBeNull();
    expect(toAssetTitle('')).toBeNull();
    expect(toAssetTitle(undefined)).toBeNull();
    expect(toAssetTitle('Yes')).toBe('Yes');
  });

  it('cuts to another length when a field allows fewer characters', () => {
    expect(truncateAtWord('A walkthrough of uploading and encoding video', 20)).toBe('A walkthrough of…');
    expect(toAssetTitle('A walkthrough of uploading and encoding video', 20)).toBe('A walkthrough of…');
  });
});
