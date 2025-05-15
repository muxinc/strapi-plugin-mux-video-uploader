import Mux from '@mux/mux-node';

import { ParsedUploadConfig, StoredTextTrack, uploadConfigToNewAssetInput } from '../../../types/shared-types';
import pluginPkg from '../../../package.json';
import { Config } from '../utils';

export interface UploadRequestConfig {
  /**
   * Max resolution tier can be used to control the maximum resolution_tier your asset is encoded, stored, and streamed at.
   * @see {@link https://docs.mux.com/guides/stream-videos-in-4k}
   * @defaultValue '1080p'
   */
  max_resolution_tier?: '2160p' | '1440p' | '1080p';

  /**
   * The video quality informs the cost, quality, and available platform features for the asset.
   * @see {@link https://www.mux.com/docs/guides/use-video-quality-levels}
   * @defaultValue 'plus'
   */
  video_quality?: 'basic' | 'plus' | 'premium';

  signed?: 'true' | 'false';
}

const getMuxClient = async () => {
  const { accessTokenId, secretKey } = await Config.getConfig();

  return new Mux({
    tokenId: accessTokenId,
    tokenSecret: secretKey,
    defaultHeaders: {
      'x-source-platform': `Strapi CMS | ${pluginPkg.version}`,
    },
  });
};

const muxService = () => ({
  async getAssetById(assetId: string) {
    const { video } = await getMuxClient();

    return await video.assets.retrieve(assetId);
  },

  async getAssetByUploadId(uploadId: string) {
    const { video } = await getMuxClient();

    const assets = await video.assets.list({ upload_id: uploadId });

    return assets.data[0];
  },

  async getDirectUploadUrl({
    config,
    storedTextTracks = [],
    corsOrigin = '*',
  }: {
    config: ParsedUploadConfig;
    storedTextTracks: StoredTextTrack[];
    corsOrigin?: string;
  }): Promise<Mux.Video.Uploads.Upload> {
    const { video } = await getMuxClient();

    return video.uploads.create({
      cors_origin: corsOrigin,
      new_asset_settings: {
        inputs: uploadConfigToNewAssetInput(config, storedTextTracks),
        playback_policies: [config.signed ? 'signed' : 'public'],
        video_quality: config.video_quality,
        max_resolution_tier: config.max_resolution_tier,
      },
    });
  },

  async createRemoteAsset({
    url,
    config,
    storedTextTracks,
  }: {
    url: string;
    storedTextTracks: StoredTextTrack[];
    config: ParsedUploadConfig;
  }) {
    const { video } = await getMuxClient();

    return video.assets.create({
      inputs: uploadConfigToNewAssetInput(config, storedTextTracks, url) || [],
      playback_policies: [config.signed ? 'signed' : 'public'],
      video_quality: config.video_quality,
      max_resolution_tier: config.max_resolution_tier,
    });
  },

  async deleteAsset(assetId: string) {
    const { video } = await getMuxClient();

    await video.assets.delete(assetId);

    return true;
  },

  async signPlaybackId(playbackId: string, type: string) {
    const { jwt } = await getMuxClient();
    const { playbackSigningSecret, playbackSigningId } = await Config.getConfig();

    let baseOptions = {
      keyId: playbackSigningId,
      keySecret: playbackSigningSecret,
      expiration: type === 'video' ? '1d' : '1m',
    };

    let params = { width: type === 'thumbnail' ? '512' : '' };

    const token = await jwt.signPlaybackId(playbackId, {
      ...baseOptions,
      // @ts-expect-error This `type` type isn't properly exposed by the Mux SDK
      type,
      params,
    });

    return { token };
  },

  async createAssetTextTracks(assetId: string, tracks: Mux.Video.Assets.AssetCreateTrackParams[]) {
    const { video } = await getMuxClient();

    return await Promise.all(tracks.map((track) => video.assets.createTrack(assetId, track)));
  },

  async deleteAssetTextTracks(assetId: string, trackIds: string[]) {
    const { video } = await getMuxClient();

    return await Promise.all(trackIds.map((id) => video.assets.deleteTrack(assetId, id)));
  },
});

export default muxService;

export type MuxService = ReturnType<typeof muxService>;
