import Mux from '@mux/mux-node';
import { RequestOptions } from '@mux/mux-node/dist/RequestOptions';
import { Asset, Upload } from '@mux/mux-node/dist/video/domain';

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

export interface MuxService {
  getAssetById: (assetId: string) => Promise<Asset>;
  getAssetByUploadId: (uploadId: string) => Promise<Asset>;
  getDirectUploadUrl: (props: {
    config: ParsedUploadConfig;
    storedTextTracks: StoredTextTrack[];
    corsOrigin?: string;
  }) => Promise<Upload>;
  createRemoteAsset: (props: {
    url: string;
    storedTextTracks: StoredTextTrack[];
    config: ParsedUploadConfig;
  }) => Promise<Asset>;
  deleteAsset: (assetId: string) => Promise<boolean>;
  signPlaybackId: (playbackId: string, type: string) => Promise<{ token: string }>;
}

const getMuxClient = async () => {
  const { access_token, secret_key } = await Config.getConfig('general');
  const options: RequestOptions = { platform: { name: 'Strapi CMS', version: pluginPkg.version } };

  return new Mux(access_token, secret_key, options);
};

export default ({ strapi }: { strapi: any }): MuxService => ({
  async getAssetById(assetId) {
    const { Video } = await getMuxClient();

    return await Video.Assets.get(assetId);
  },

  async getAssetByUploadId(uploadId) {
    const { Video } = await getMuxClient();

    const assets = await Video.Assets.list({ upload_id: uploadId });

    return assets[0];
  },

  async getDirectUploadUrl({ config, storedTextTracks = [], corsOrigin = '*' }): Promise<Upload> {
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

  async createRemoteAsset({ url, config, storedTextTracks }) {
    const { Video } = await getMuxClient();

    return Video.Assets.create({
      input: uploadConfigToNewAssetInput(config, storedTextTracks, url) || [],
      playback_policy: [config.signed ? 'signed' : 'public'],
      mp4_support: config.mp4_support,
      encoding_tier: config.encoding_tier,
      max_resolution_tier: config.max_resolution_tier,
    });
  },

  async deleteAsset(assetId) {
    const { Video } = await getMuxClient();

    await Video.Assets.del(assetId);

    return true;
  },

  async signPlaybackId(playbackId, type) {
    const { JWT } = Mux;
    const { playback_signing_secret, playback_signing_id } = await Config.getConfig('general');

    let baseOptions = {
      keyId: playback_signing_id,
      keySecret: playback_signing_secret,
      expiration: type == 'video' ? '1d' : '1m',
    };

    let params = { width: type == 'thumbnail' ? '512' : '' };

    const token = JWT.signPlaybackId(playbackId, { ...baseOptions, type: type, params });

    return { token: token };
  },
});
