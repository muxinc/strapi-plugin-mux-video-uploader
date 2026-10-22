import { describe, expect, it } from 'vitest';

import {
  firstErrorMessage,
  isUnfinishedRow,
  placeholderPhase,
  ROBOTS_CONFIRM_GRACE_MS,
  ROBOTS_STALE_MS,
  RobotsJobRow,
  temporaryDownloads,
  unitsState,
} from './robots';

const NOW = Date.parse('2026-10-12T15:00:00.000Z');
const ago = (ms: number) => new Date(NOW - ms).toISOString();

const row = (overrides: Partial<RobotsJobRow> = {}) =>
  ({
    id: 1,
    mux_id: 'rjob_1',
    is_directive_run: false,
    workflow: 'summarize',
    status: 'processing',
    mux_created_at: ago(60_000),
    requested_at: null,
    units_consumed: null,
    detail_loaded: false,
    ...overrides,
  }) as RobotsJobRow;

describe('placeholderPhase', () => {
  it('reads "starting" for 45 seconds, then "not confirmed"', () => {
    expect(placeholderPhase({ status: 'requested', requested_at: ago(ROBOTS_CONFIRM_GRACE_MS - 1000) }, NOW)).toBe(
      'starting'
    );
    expect(placeholderPhase({ status: 'requested', requested_at: ago(ROBOTS_CONFIRM_GRACE_MS + 1000) }, NOW)).toBe(
      'unconfirmed'
    );
  });

  it('keeps reading "starting" for 45 seconds even once the server knows Mux did not answer', () => {
    expect(placeholderPhase({ status: 'unconfirmed', requested_at: ago(1000) }, NOW)).toBe('starting');
    expect(placeholderPhase({ status: 'unconfirmed', requested_at: ago(ROBOTS_CONFIRM_GRACE_MS + 1000) }, NOW)).toBe(
      'unconfirmed'
    );
  });
});

describe('isUnfinishedRow', () => {
  it('follows jobs and runs Mux is still working on, for six hours', () => {
    expect(isUnfinishedRow(row(), NOW)).toBe(true);
    expect(isUnfinishedRow(row({ is_directive_run: true, status: 'waiting' }), NOW)).toBe(true);
    expect(isUnfinishedRow(row({ mux_created_at: ago(ROBOTS_STALE_MS + 1000) }), NOW)).toBe(false);
  });

  it('dates a row Mux gave no time for by when it was stored, and stops following one nobody can date', () => {
    const undated = { mux_created_at: null, requested_at: null };

    expect(isUnfinishedRow(row({ ...undated, createdAt: ago(1000) }), NOW)).toBe(true);
    expect(isUnfinishedRow(row({ ...undated, createdAt: ago(ROBOTS_STALE_MS + 1000) }), NOW)).toBe(false);
    expect(isUnfinishedRow(row({ ...undated, createdAt: null }), NOW)).toBe(false);
  });

  it('stops at terminal statuses, and leaves placeholders to their own counter', () => {
    expect(isUnfinishedRow(row({ status: 'completed' }), NOW)).toBe(false);
    expect(isUnfinishedRow(row({ is_directive_run: true, status: 'partial' }), NOW)).toBe(false);
    expect(isUnfinishedRow(row({ mux_id: null, status: 'requested' }), NOW)).toBe(false);
  });
});

describe('unitsState', () => {
  it.each([
    [{ status: 'errored' }, 'not-charged'],
    [{ status: 'cancelled', units_consumed: 3 }, 'not-charged'],
    [{ status: 'completed', units_consumed: 3 }, 'count'],
    [{ status: 'processing' }, 'not-counted-yet'],
    [{ status: 'pending', units_consumed: 0 }, 'not-counted-yet'],
    [{ status: 'completed', detail_loaded: false }, 'not-loaded'],
    [{ status: 'completed', detail_loaded: true }, 'not-reported'],
  ] as const)('%o says %s', (overrides, kind) => {
    expect(unitsState(row(overrides as Partial<RobotsJobRow>)).kind).toBe(kind);
  });
});

describe('firstErrorMessage', () => {
  it('reads the shapes Mux uses for job errors', () => {
    expect(firstErrorMessage([{ type: 'x', message: 'No captions to read.' }])).toBe('No captions to read.');
    expect(firstErrorMessage([{ messages: ['First.', 'Second.'] }])).toBe('First.');
    expect(firstErrorMessage({ message: 'Object form.' })).toBe('Object form.');
    expect(firstErrorMessage(['Plain string.'])).toBe('Plain string.');
    expect(firstErrorMessage(null)).toBeUndefined();
  });
});

describe('temporaryDownloads', () => {
  const signed = (date: string, seconds: number) =>
    `https://s3.us-east-1.amazonaws.com/mux-robots/captions/a.vtt?X-Amz-Date=${date}&X-Amz-Expires=${seconds}&X-Amz-Signature=abc`;

  it('reads when the link expires from its signature', () => {
    const url = signed('20261013T155150Z', 604800);

    expect(temporaryDownloads(row({ outputs: { temporary_vtt_url: url } }))).toEqual([
      { key: 'temporary_vtt_url', url, expiresAtMs: Date.parse('2026-10-20T15:51:50Z') },
    ]);
  });

  it('falls back to 7 days after the job last changed when the link has no signing date', () => {
    const url = 'https://example.com/a.srt';

    expect(
      temporaryDownloads(row({ outputs: { temporary_srt_url: url }, mux_updated_at: '2026-10-13T00:00:00.000Z' }))
    ).toEqual([{ key: 'temporary_srt_url', url, expiresAtMs: Date.parse('2026-10-20T00:00:00.000Z') }]);
  });

  it('lists every temporary link and skips other outputs and links that are not https', () => {
    const downloads = temporaryDownloads(
      row({
        outputs: {
          temporary_srt_url: 'https://example.com/a.srt',
          temporary_words_url: 'https://example.com/a.json',
          temporary_audio_url: 'javascript:alert(1)',
          uploaded_track_id: 'trk_1',
        },
      })
    );

    expect(downloads.map((download) => download.key)).toEqual(['temporary_srt_url', 'temporary_words_url']);
  });
});
