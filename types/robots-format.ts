/** `mux-asset.title` is required, 3–255 characters. */
const ASSET_TITLE_MIN_LENGTH = 3;
const ASSET_TITLE_MAX_LENGTH = 255;

/**
 * Cuts `text` to at most `maxLength` characters on a word boundary, ending in "…". Text that fits is
 * returned as is.
 */
export function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Room for the ellipsis, then back to the last space before the cut, unless the cut already
  // falls between two words.
  const limit = Math.max(0, maxLength - 1);
  const slice = text.slice(0, limit);
  const endsBetweenWords = /\s/.test(text.charAt(limit));
  const lastSpace = slice.lastIndexOf(' ');
  const base = (endsBetweenWords || lastSpace <= 0 ? slice : slice.slice(0, lastSpace)).trimEnd();

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

export type EntryOutputKey = 'title' | 'description' | 'tags';

/** A top-level field of the entry, as the edit view shows it. */
export interface EntryFieldOption {
  name: string;
  /** The display name the edit view uses. */
  label: string;
  /** The attribute type: `string`, `text`, `richtext`, `blocks`, `json`, … */
  type: string;
  maxLength?: number;
  minLength?: number;
}

const TEXT_TARGETS = ['string', 'text', 'richtext', 'blocks'];

/** Tags only go to JSON, as a list: never joined into text. */
const OUTPUT_TARGET_TYPES: Record<EntryOutputKey, string[]> = {
  title: TEXT_TARGETS,
  description: TEXT_TARGETS,
  tags: ['json'],
};

/** Field names that suggest a target, most specific first. Matched exactly, ignoring case. */
const PREFILL_FIELD_NAMES: Record<EntryOutputKey, string[]> = {
  title: ['title', 'seoTitle', 'metaTitle', 'headline', 'name'],
  description: ['seoDescription', 'metaDescription', 'description', 'summary', 'excerpt', 'abstract'],
  tags: ['tags', 'keywords', 'topics', 'categories'],
};

/** A `string` attribute without a declared `maxLength` still stops at 255 in the database. */
const STRING_FIELD_DEFAULT_MAX_LENGTH = 255;

export interface ApplyRow {
  key: EntryOutputKey;
  /** What Robots generated. */
  value: string | string[];
  compatible: EntryFieldOption[];
  /** The convention's pick, else the first compatible field. */
  suggested?: EntryFieldOption;
}

/**
 * One row per output the summary has a value for. There is no mapping to configure: the candidates
 * come from the content type, a naming convention only suggests one, and the person picks in the dialog.
 */
export function buildApplyRows(
  summary: { title?: string; description?: string; tags?: string[] } | null | undefined,
  fields: EntryFieldOption[]
): ApplyRow[] {
  if (!summary) return [];

  const rows: ApplyRow[] = [];
  const outputs: Array<[EntryOutputKey, string | string[] | undefined]> = [
    ['title', summary.title],
    ['description', summary.description],
    ['tags', summary.tags],
  ];

  for (const [key, value] of outputs) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' ? value.trim() === '' : !Array.isArray(value) || value.length === 0) continue;

    const compatible = fields.filter((field) => OUTPUT_TARGET_TYPES[key].includes(field.type));
    const byName = PREFILL_FIELD_NAMES[key]
      .map((name) => compatible.find((field) => field.name.toLowerCase() === name.toLowerCase()))
      .find(Boolean);

    rows.push({ key, value, compatible, suggested: byName ?? compatible[0] });
  }

  return rows;
}

export const blocksParagraph = (text: string) => [{ type: 'paragraph', children: [{ type: 'text', text }] }];

/** The readable text of a field value: a string as is, blocks and rich structures as their text. */
export function plainTextOf(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    // A list of strings (tags) reads as a list; blocks read as their paragraphs.
    if (value.every((entry) => typeof entry === 'string')) return value.join(', ');
    return value
      .map((block) => plainTextOf(block))
      .filter((text) => text !== '')
      .join('\n');
  }

  if (typeof value === 'object') {
    const node = value as { text?: unknown; children?: unknown };
    if (typeof node.text === 'string') return node.text;
    if (Array.isArray(node.children)) return node.children.map((child) => plainTextOf(child)).join('');
    return JSON.stringify(value);
  }

  return '';
}

/** Whether a field holds nothing worth keeping. An empty blocks paragraph counts as empty. */
export function isEmptyFieldValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0 || plainTextOf(value).trim() === '';
  return false;
}

const maxLengthOf = (field: EntryFieldOption) =>
  field.maxLength ?? (field.type === 'string' ? STRING_FIELD_DEFAULT_MAX_LENGTH : undefined);

/** The value as the field stores it: cut to fit on a word boundary, and blocks as one paragraph. */
export function valueForField(value: string | string[], field: EntryFieldOption): unknown {
  if (Array.isArray(value)) return value;

  const max = maxLengthOf(field);
  const text = max !== undefined ? truncateAtWord(value.trim(), max) : value.trim();

  return field.type === 'blocks' ? blocksParagraph(text) : text;
}

/** Why a row can't be applied to `field`, if it can't: a value shorter than the field allows. */
export function minLengthProblem(value: string | string[], field: EntryFieldOption): string | undefined {
  if (Array.isArray(value) || field.minLength === undefined) return undefined;

  const text = plainTextOf(valueForField(value, field));
  return text.length < field.minLength
    ? `${field.label} needs at least ${field.minLength} characters; the generated text has ${text.length}.`
    : undefined;
}

/** Whether the field already holds exactly what applying would write. */
export function matchesGeneratedValue(current: unknown, value: string | string[], field: EntryFieldOption): boolean {
  const generated = valueForField(value, field);

  if (Array.isArray(generated) && generated.every((entry) => typeof entry === 'string')) {
    return (
      Array.isArray(current) &&
      current.length === generated.length &&
      current.every((entry, index) => entry === generated[index])
    );
  }

  return !isEmptyFieldValue(current) && plainTextOf(current) === plainTextOf(generated);
}

/**
 * The field each row opens on, or `''` for "Do not apply". A row is pre-selected only when its
 * suggested field is empty, and a field is the target of one row at most.
 */
export function defaultTargets(
  rows: ApplyRow[],
  currentValues: Record<string, unknown>
): Record<EntryOutputKey, string> {
  const targets = {} as Record<EntryOutputKey, string>;
  const taken = new Set<string>();

  for (const row of rows) {
    const field = row.suggested;
    const usable =
      !!field &&
      !taken.has(field.name) &&
      isEmptyFieldValue(currentValues[field.name]) &&
      !minLengthProblem(row.value, field);

    targets[row.key] = usable ? field!.name : '';
    if (usable) taken.add(field!.name);
  }

  return targets;
}

const MUX_ASSET_UID = 'plugin::mux-video-uploader.mux-asset';

/**
 * The top-level relation attributes of a content type that point at Mux assets. Relations inside
 * components and dynamic zones aren't followed.
 */
export const muxAssetRelationFields = (attributes: Record<string, any> | undefined = {}) =>
  Object.entries(attributes ?? {})
    .filter(([, attribute]) => attribute?.type === 'relation' && attribute?.target === MUX_ASSET_UID)
    .map(([name]) => name);
