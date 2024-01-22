import Mux, { CreateTrackParams, Upload } from '@mux/mux-node';
import { RequestOptions } from '@mux/mux-node/dist/RequestOptions';

import { ParsedUploadConfig, StoredTextTrack, uploadConfigToNewAssetInput } from '../../types/shared-types';
import pluginPkg from './../../package.json';
import { Config } from './../utils';

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

const getMuxClient = async () => {
  const { access_token, secret_key } = await Config.getConfig('general');
  const options: RequestOptions = { platform: { name: 'Strapi CMS', version: pluginPkg.version } };

  return new Mux(access_token, secret_key, options);
};

const muxService = () => ({
  async getAssetById(assetId: string) {
    const { Video } = await getMuxClient();

    return await Video.Assets.get(assetId);
  },

  async getAssetByUploadId(uploadId: string) {
    const { Video } = await getMuxClient();

    const assets = await Video.Assets.list({ upload_id: uploadId });

    return assets[0];
  },

  async getDirectUploadUrl({
    config,
    storedTextTracks = [],
    corsOrigin = '*',
  }: {
    config: ParsedUploadConfig;
    storedTextTracks: StoredTextTrack[];
    corsOrigin?: string;
  }): Promise<Upload> {
    const { Video } = await getMuxClient();

    return Video.Uploads.create({
      cors_origin: corsOrigin,
      new_asset_settings: {
        input: uploadConfigToNewAssetInput(config, storedTextTracks),
        playback_policy: config.signed ? 'signed' : 'public',
        mp4_support: config.mp4_support,
        encoding_tier: config.encoding_tier,
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
    const { Video } = await getMuxClient();

    return Video.Assets.create({
      input: uploadConfigToNewAssetInput(config, storedTextTracks, url) || [],
      playback_policy: [config.signed ? 'signed' : 'public'],
      mp4_support: config.mp4_support,
      encoding_tier: config.encoding_tier,
      max_resolution_tier: config.max_resolution_tier,
    });
  },

  async deleteAsset(assetId: string) {
    const { Video } = await getMuxClient();

    await Video.Assets.del(assetId);

    return true;
  },

  async signPlaybackId(playbackId: string, type: string) {
    const { JWT } = Mux;
    const { playback_signing_secret, playback_signing_id } = await Config.getConfig('general');

    let baseOptions = {
      keyId: playback_signing_id,
      keySecret: playback_signing_secret,
      expiration: type === 'video' ? '1d' : '1m',
    };

    let params = { width: type === 'thumbnail' ? '512' : '' };

    const token = JWT.signPlaybackId(playbackId, { ...baseOptions, type: type, params });

    return { token: token };
  },

  async createAssetTextTracks(assetId: string, tracks: CreateTrackParams[]) {
    const { Video } = await getMuxClient();

    return await Promise.all(tracks.map((track) => Video.Assets.createTrack(assetId, track)));
  },

  async deleteAssetTextTracks(assetId: string, trackIds: string[]) {
    const { Video } = await getMuxClient();

    return await Promise.all(trackIds.map((id) => Video.Assets.deleteTrack(assetId, id)));
  },
});

export default muxService;

export type MuxService = ReturnType<typeof muxService>;
