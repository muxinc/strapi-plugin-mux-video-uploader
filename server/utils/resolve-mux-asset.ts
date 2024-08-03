import { MuxAsset } from '../content-types/mux-asset/types';
import { ASSET_MODEL } from './types';

export const resolveMuxAsset = async (filtersRaw: MuxAssetFilter): Promise<MuxAsset> => {
  const filters = Object.fromEntries(Object.entries(filtersRaw).filter(([, value]) => value !== undefined));

  if (Object.keys(filters).length === 0) throw new Error('Unable to resolve mux-asset');

  const muxAssets = await strapi.entityService.findMany(ASSET_MODEL, { filters: filters as any });

  const asset = muxAssets ? (Array.isArray(muxAssets) ? muxAssets[0] : muxAssets) : undefined;

  if (!asset) throw new Error('Unable to resolve mux-asset');

  return asset;
};

export interface MuxAssetFilter {
  upload_id?: string;
  asset_id?: string;
  documentId?: string;
}
