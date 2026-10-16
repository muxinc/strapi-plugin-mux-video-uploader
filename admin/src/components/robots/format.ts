import { DateTime } from 'luxon';

export const EM_DASH = '—';

export const relativeTime = (iso: string | null | undefined) => {
  if (!iso) return EM_DASH;
  const time = DateTime.fromISO(iso);
  return time.isValid ? (time.toRelative() ?? EM_DASH) : EM_DASH;
};

export const exactTime = (iso: string | null | undefined) => {
  if (!iso) return '';
  const time = DateTime.fromISO(iso);
  return time.isValid ? time.toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS) : '';
};

/** `m:ss`, with minutes past 59 rather than hours. */
export const formatMs = (ms: unknown) => {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return EM_DASH;
  const totalSeconds = Math.floor(ms / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
};

export const formatSeconds = (seconds: unknown) =>
  typeof seconds === 'number' && Number.isFinite(seconds) ? formatMs(seconds * 1000) : EM_DASH;

export const formatScore = (score: unknown) => (typeof score === 'number' ? score.toFixed(2) : EM_DASH);

export const formatText = (value: unknown) =>
  value === undefined || value === null || value === '' ? EM_DASH : String(value);

export const asRows = (value: unknown): Array<Record<string, unknown>> =>
  Array.isArray(value) ? value.filter((entry) => !!entry && typeof entry === 'object') : [];

export const asStrings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];

/** `undefined` when there's nothing printable, so the caller can say so instead of drawing an empty box. */
export const prettyJson = (value: unknown): string | undefined => {
  try {
    const text = JSON.stringify(value, null, 2);
    return typeof text === 'string' && text.trim().length > 0 ? text : undefined;
  } catch {
    return undefined;
  }
};

/** `temporary_*_url` links expire, so showing one invites a click on a dead link. */
export function withoutTemporaryUrls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutTemporaryUrls);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !/^temporary_.*_url$/.test(key))
      .map(([key, entry]) => [key, withoutTemporaryUrls(entry)])
  );
}
