import Mux from '@mux/mux-node';
import { ParsedUploadConfig, StoredTextTrack } from '../../../types/shared-types';
export interface UploadRequestConfig {
    /**
     * Enable static renditions by setting this to 'standard'. Can be overwritten on a per-asset basis.
     * @see {@link https://docs.mux.com/guides/video/enable-static-mp4-renditions#why-enable-mp4-support}
     * @defaultValue 'none'
     */
    mp4_support?: 'none' | 'standard';
    /**
     * Max resolution tier can be used to control the maximum resolution_tier your asset is encoded, stored, and streamed at.
     * @see {@link https://docs.mux.com/guides/stream-videos-in-4k}
     * @defaultValue '1080p'
     */
    max_resolution_tier?: '2160p' | '1440p' | '1080p';
    /**
     * The encoding tier informs the cost, quality, and available platform features for the asset.
     * @see {@link https://docs.mux.com/guides/use-encoding-tiers}
     * @defaultValue 'smart'
     */
    encoding_tier?: 'baseline' | 'smart';
    signed?: 'true' | 'false';
}
declare const muxService: () => {
    getAssetById(assetId: string): Promise<Mux.Video.Assets.Asset>;
    getAssetByUploadId(uploadId: string): Promise<Mux.Video.Assets.Asset>;
    getDirectUploadUrl({ config, storedTextTracks, corsOrigin, }: {
        config: ParsedUploadConfig;
        storedTextTracks: StoredTextTrack[];
        corsOrigin?: string;
    }): Promise<Mux.Video.Uploads.Upload>;
    createRemoteAsset({ url, config, storedTextTracks, }: {
        url: string;
        storedTextTracks: StoredTextTrack[];
        config: ParsedUploadConfig;
    }): Promise<Mux.Video.Assets.Asset>;
    deleteAsset(assetId: string): Promise<boolean>;
    signPlaybackId(playbackId: string, type: string): Promise<{
        token: string;
    }>;
    createAssetTextTracks(assetId: string, tracks: Mux.Video.Assets.AssetCreateTrackParams[]): Promise<Mux.Video.Assets.Track[]>;
    deleteAssetTextTracks(assetId: string, trackIds: string[]): Promise<void[]>;
};
export default muxService;
export type MuxService = ReturnType<typeof muxService>;
