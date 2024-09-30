import type Mux from '@mux/mux-node';
import { ParsedCustomTextTrack } from '../../../../types/shared-types';

export interface MuxAsset extends MuxAssetUpdate {
  upload_id: string;
  isReady: boolean;
  title: string;
  asset_id: string | null;
  playback_id: string | null;
  signed: boolean;
  error_message: string | null;
  duration: number | null;
  aspect_ratio: string | null;
  created_by_id: string | null;
  updated_by_id: string | null;
  createdAt: string;
  updatedAt: string;
  asset_data?: Mux.Video.Assets.Asset;
}

export interface MuxAssetUpdate {
  id: number;
  title?: string;
  /** File is optional when updating, and only exists if user is updating the captions */
  custom_text_tracks?: (Omit<ParsedCustomTextTrack, 'file'> & {
    file?: ParsedCustomTextTrack['file'];
  })[];
}

export interface GetMuxAssetsResponse {
  items: MuxAsset[];
  totalCount: number;
}
