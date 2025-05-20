import type Mux from '@mux/mux-node';
import { ParsedCustomTextTrack, StoredTextTrack } from '../../../types/shared-types';
import { MuxAsset, MuxAssetUpdate } from '../content-types/mux-asset/types';
export declare function storeTextTracks(custom_text_tracks: ParsedCustomTextTrack[]): Promise<StoredTextTrack[]>;
export declare function storedTextTrackToMuxTrack(track: StoredTextTrack): Mux.Video.AssetCreateTrackParams;
export declare function getMuxTextTrackUrl({ playback_id, track, signedToken, }: {
    playback_id: MuxAsset['playback_id'];
    track: Pick<Mux.Video.Track, 'id'>;
    signedToken?: string;
}): string;
/**
 * Deletes, creates or updates (deleting & recreating) modified subtitles & captions.
 * Doesn't modify the `mux-asset`'s `asset_data` in the Strapi database (that's handled by Mux's webhook handlers).
 */
export declare function updateTextTracks(muxAsset: MuxAsset, newTracks: MuxAssetUpdate['custom_text_tracks']): Promise<MuxAsset['asset_data'] | undefined>;
