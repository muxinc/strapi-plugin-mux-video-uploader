import { ASSET_MODEL } from '../server/src/utils/types';
import type { FakeDb } from './strapi';

/** Mux timestamps are Unix seconds. */
export const unixNow = () => Math.floor(Date.now() / 1000);

export const isoAt = (unixSeconds: number) => new Date(unixSeconds * 1000).toISOString();

/** A Robots job as Mux describes it: in a webhook, or in an API answer. */
export const muxJob = (overrides: Record<string, unknown> = {}) => ({
  id: 'rjob_1',
  workflow: 'summarize',
  status: 'pending',
  created_at: unixNow(),
  updated_at: unixNow(),
  parameters: { asset_id: 'ast_1' },
  ...overrides,
});

/** A stored row for a job Mux confirmed. */
export const jobRow = (overrides: Record<string, unknown> = {}) => ({
  mux_id: 'rjob_1',
  is_directive_run: false,
  workflow: 'summarize',
  status: 'processing',
  asset_id: 'ast_1',
  ...overrides,
});

/** A stored row for a create Mux hasn't confirmed. */
export const placeholderRow = (overrides: Record<string, unknown> = {}) => ({
  mux_id: null,
  is_directive_run: false,
  workflow: 'summarize',
  status: 'unconfirmed',
  asset_id: 'ast_1',
  request_id: 'abcdef0123456789',
  requested_at: new Date().toISOString(),
  requested_by: 1,
  ...overrides,
});

/** A ready mux-asset for `ast_1`, stored without going through the spies. */
export const seedAsset = (db: FakeDb, data: Record<string, unknown> = {}) =>
  db.seed(ASSET_MODEL, [{ title: 'A video', asset_id: 'ast_1', isReady: true, signed: false, ...data }])[0];
