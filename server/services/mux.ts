import Mux from '@mux/mux-node';
import { Asset, Upload, JWTOptions } from '@mux/mux-node/cjs/video/domain';

import { Config, handleAxiosRequest } from './../utils';
import { MuxAsset, MuxPlaybackPolicy, MuxResourceType } from '../../types';

export interface UploadInfoData {
  id: string;
  url: string;
  error?: { type: string; message: string };
}

interface UpdatePlaybackPolicyData {
  id: string;
  policy: MuxPlaybackPolicy;
}

export interface MuxService {
  getAssetById: (assetId: string) => Promise<Asset>;
  getAssetByUploadId: (uploadId: string) => Promise<Asset>;
  getDirectUploadUrl: (
    playbackPolicy: MuxPlaybackPolicy,
    corsOrigin?: string
  ) => Promise<UploadInfoData>;
  getPlaybackToken: (
    playbackId: string,
    type: MuxResourceType,
    params?: unknown
  ) => Promise<string>;
  createAsset: (url: string, playbackPolicy: MuxPlaybackPolicy) => Promise<any>;
  updatePlaybackPolicy: (
    assetId: MuxAsset,
    playbackPolicy: MuxPlaybackPolicy
  ) => Promise<UpdatePlaybackPolicyData>;
  deleteAsset: (assetId: string) => Promise<boolean>;
}

export default ({ strapi }: { strapi: any }) => ({
  async getAssetById(assetId: string): Promise<Asset> {
    const { access_token, secret_key } = await Config.getConfig('general');
    const { Video } = new Mux(access_token, secret_key);

    return await Video.Assets.get(assetId);
  },
  async getAssetByUploadId(uploadId: string): Promise<Asset> {
    const { access_token, secret_key } = await Config.getConfig('general');
    const { Video } = new Mux(access_token, secret_key);

    const assets = await Video.Assets.list({ upload_id: uploadId });

    return assets[0];
  },
  async getDirectUploadUrl(corsOrigin: string = '*'): Promise<Upload> {
    const { access_token, secret_key } = await Config.getConfig('general');
    const { Video } = new Mux(access_token, secret_key);

    return Video.Uploads.create({
      cors_origin: corsOrigin,
      new_asset_settings: {
        playback_policy: ['public'],
      },
    });
  },
  async getPlaybackToken(
    playbackId: string,
    type: MuxResourceType = 'video',
    params?: { [key: string]: unknown }
  ) {
    const config = await Config.getConfig('general');

    const sanitizedSecret = config.playback_key_secret.replace(
      /(\r\n|\n|\r)/gm,
      '\n'
    );

    const options: JWTOptions = {
      keyId: config.playback_key_id,
      keySecret: sanitizedSecret,
      type,
      expiration: config.playback_expiration,
    };

    if (params) {
      options.params = params;
    }

    return Mux.JWT.sign(playbackId, options);
  },

  async createAsset(
    url: string,
    playbackPolicy: MuxPlaybackPolicy
  ): Promise<Asset> {
    const { access_token, secret_key } = await Config.getConfig('general');
    const { Video } = new Mux(access_token, secret_key);

    return Video.Assets.create({
      input: url,
      playback_policy: [playbackPolicy],
    });
  },

  async deleteAsset(assetId: string): Promise<boolean> {
    const { access_token, secret_key } = await Config.getConfig('general');
    const { Video } = new Mux(access_token, secret_key);

    await Video.Assets.del(assetId);

    return true;
  },

  async updatePlaybackPolicy(
    asset: MuxAsset,
    playbackPolicy: MuxPlaybackPolicy
  ): Promise<UpdatePlaybackPolicyData> {
    if (asset.playback_policy === playbackPolicy) {
      return {
        id: asset.playback_id ?? '',
        policy: asset.playback_policy,
      };
    }

    if (!asset.asset_id || !asset.playback_id) {
      throw new Error("Can't update playback policy");
    }

    const createData = await this.createPlaybackId(
      asset.asset_id,
      playbackPolicy
    );

    try {
      await this.deletePlaybackId(asset.asset_id, asset.playback_id);
    } catch (_) {
      // Skip delete error
    }

    return createData;
  },

  async createPlaybackId(assetId: string, policy: MuxPlaybackPolicy) {
    const { access_token, secret_key } = await Config.getConfig('general');
    const { Video } = new Mux(access_token, secret_key);

    return await Video.Assets.createPlaybackId(assetId, { policy });
  },

  async deletePlaybackId(assetId: string, playbackId: string) {
    const { access_token, secret_key } = await Config.getConfig('general');
    const { Video } = new Mux(access_token, secret_key);

    return await Video.Assets.deletePlaybackId(assetId, playbackId);
  },
});
