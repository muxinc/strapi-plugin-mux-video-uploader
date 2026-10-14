import type Mux from '@mux/ts';
import type { RobotsOutputs } from '../../../../types/robots';
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
  description?: string | null;
  tags?: string[] | null;
  robots_outputs?: RobotsOutputs | null;
}

export interface MuxAssetUpdate {
  id: number;
  title?: string;
  /** File is optional when updating, and only exists if user is updating the captions */
  custom_text_tracks?: (Omit<ParsedCustomTextTrack, 'file'> & {
    file?: ParsedCustomTextTrack['file'];
  })[];
  /** Ids of the text tracks the form was opened with. */
  known_track_ids?: string[];
}

export interface GetMuxAssetsResponse {
  items: MuxAsset[];
  totalCount: number;
}
