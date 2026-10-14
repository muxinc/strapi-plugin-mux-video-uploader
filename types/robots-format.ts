/** `mux-asset.title` is required, 3–255 characters. */
const ASSET_TITLE_MIN_LENGTH = 3;
const ASSET_TITLE_MAX_LENGTH = 255;

/**
 * Cuts `text` to at most `maxLength` characters on a word boundary, ending in "…". Text that fits is
 * returned as is.
 */
export function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Room for the ellipsis, then back to the last space before the cut.
  const slice = text.slice(0, Math.max(0, maxLength - 1));
  const lastSpace = slice.lastIndexOf(' ');
  const base = (lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trimEnd();

  return `${base}…`;
}

const normalizeWhitespace = (text: string) => text.trim().replace(/\s+/g, ' ');

/**
 * A generated title as `mux-asset.title` can store it, or `null` when too short. Robots'
 * `title_length` counts words and has no ceiling, so long titles are expected and cut on a word boundary.
 */
export function toAssetTitle(raw: unknown, maxLength = ASSET_TITLE_MAX_LENGTH): string | null {
  if (typeof raw !== 'string') return null;

  const title = truncateAtWord(normalizeWhitespace(raw), maxLength);

  return title.length < ASSET_TITLE_MIN_LENGTH ? null : title;
}
