
export interface MuxAsset extends MuxAssetUpdate {
  upload_id: string;
  asset_id: string | null;
  playback_id: string | null;
  error_message: string | null;
  duration: number | null;
  aspect_ratio: string | null;
  created_by_id: string | null;
  updated_by_id: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MuxAssetUpdate {
  id: number;
  title: string;
  isReady: boolean;
}

export interface GetMuxAssetsResponse {
  items: MuxAsset[];
  totalCount: number;
}
