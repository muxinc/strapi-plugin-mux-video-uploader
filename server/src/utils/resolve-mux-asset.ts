import { MuxAsset } from '../content-types/mux-asset/types';
import { ASSET_MODEL } from './types';

export const resolveMuxAsset = async (filters: MuxAssetFilter): Promise<MuxAsset> => {
  const asset = await resolveMuxAssetOrNull(filters);

  if (!asset) throw new Error('Unable to resolve mux-asset');

  return asset;
};

/**
 * Webhooks get events for assets this Strapi doesn't have, and throwing on one would make Mux retry it
 * for 24 hours.
 */
export const resolveMuxAssetOrNull = async (filters: MuxAssetFilter): Promise<MuxAsset | null> => {
  // An empty filter matches every row, so an event without an id must not resolve to the first one.
  const hasFilter = Object.values(filters).some((value) => value !== undefined && value !== null && value !== '');
  if (!hasFilter) return null;

  // const muxAssets = await strapi.documents(ASSET_MODEL).findMany({
  //   filters: filters as any
  // });

  const muxAssets = await strapi.db.query(ASSET_MODEL).findMany({
    filters,
  });

  const asset = muxAssets ? (Array.isArray(muxAssets) ? muxAssets[0] : muxAssets) : undefined;

  return asset ?? null;
};

export interface MuxAssetFilter {
  upload_id?: string;
  asset_id?: string;
  documentId?: string;
  id?: string;
}
