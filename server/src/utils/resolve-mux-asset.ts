import { MuxAsset } from '../content-types/mux-asset/types';
import { ASSET_MODEL } from './types';

export const resolveMuxAsset = async (filters: MuxAssetFilter): Promise<MuxAsset> => {
  const asset = await resolveMuxAssetOrNull(filters);

  if (!asset) throw new Error('Unable to resolve mux-asset');

  return asset;
};

/**
 * Every row the filter matches, oldest first. `asset_id` isn't unique: two rows can point at one Mux
 * asset, and whatever Mux says about the asset belongs on each of them.
 */
export const findMuxAssets = async (filters: MuxAssetFilter): Promise<MuxAsset[]> => {
  // An empty filter matches every row, so an event without an id must not resolve to any of them.
  const hasFilter = Object.values(filters).some((value) => value !== undefined && value !== null && value !== '');
  if (!hasFilter) return [];

  const muxAssets = await strapi.db.query(ASSET_MODEL).findMany({ filters, orderBy: { id: 'asc' } });

  return (Array.isArray(muxAssets) ? muxAssets : muxAssets ? [muxAssets] : []) as MuxAsset[];
};

/**
 * The oldest row the filter matches. Webhooks get events for assets this Strapi doesn't have, and
 * throwing on one would make Mux retry it for 24 hours.
 */
export const resolveMuxAssetOrNull = async (filters: MuxAssetFilter): Promise<MuxAsset | null> =>
  (await findMuxAssets(filters))[0] ?? null;

/** Writes `data` onto every row the filter matches. Returns them as stored. */
export const updateMuxAssets = async (filters: MuxAssetFilter, data: Record<string, unknown>): Promise<MuxAsset[]> => {
  const updated: MuxAsset[] = [];

  for (const muxAsset of await findMuxAssets(filters)) {
    updated.push((await strapi.db.query(ASSET_MODEL).update({ where: { id: muxAsset.id }, data })) as MuxAsset);
  }

  return updated;
};

export interface MuxAssetFilter {
  upload_id?: string;
  asset_id?: string;
  playback_id?: string;
  documentId?: string;
  id?: string;
}
