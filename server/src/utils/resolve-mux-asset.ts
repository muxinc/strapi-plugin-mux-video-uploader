import { MuxAsset } from '../content-types/mux-asset/types';
import { ASSET_MODEL } from './types';

export const resolveMuxAsset = async (filters: MuxAssetFilter): Promise<MuxAsset> => {
  // const muxAssets = await strapi.documents(ASSET_MODEL).findMany({
  //   filters: filters as any
  // });

  const muxAssets = await strapi.db.query(ASSET_MODEL).findMany({
    filters,
  });

  const asset = muxAssets ? (Array.isArray(muxAssets) ? muxAssets[0] : muxAssets) : undefined;

  if (!asset) throw new Error('Unable to resolve mux-asset');

  return asset;
};

export interface MuxAssetFilter {
  upload_id?: string;
  asset_id?: string;
  documentId?: string;
}
