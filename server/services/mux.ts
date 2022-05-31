import axios from 'axios';
import Mux, { JWTOptions } from '@mux/mux-node';

import { Config, handleAxiosRequest } from './../utils';
import { MuxAsset, MuxPlaybackPolicy, MuxResourceType } from '../../types';

export interface UploadInfoData {
  id: string;
  url: string;
  error?: { type: string; message: string };
}

interface UpdatePlaybackPolicyData {
  playbackId: string;
  playbackPolicy: MuxPlaybackPolicy;
}

export interface MuxService {
  getAssetIdByUploadId: (uploadId: string) => Promise<string>;
  getDirectUploadUrl: (
    playbackPolicy: MuxPlaybackPolicy,
    corsOrigin?: string
  ) => Promise<UploadInfoData>;
  getPlaybackToken: (
    playbackId: string,
    type: MuxResourceType,
    params?: unknown
  ) => Promise<string>;
  createAsset: (url: string) => Promise<any>;
  updatePlaybackPolicy: (
    assetId: MuxAsset,
    playbackPolicy: MuxPlaybackPolicy
  ) => Promise<UpdatePlaybackPolicyData>;
  deleteAsset: (assetId: string) => Promise<boolean>;
}

export default ({ strapi }: { strapi: any }) => ({
  async getAssetIdByUploadId(uploadId: string) {
    const config = await Config.getConfig('general');

    const result = await axios(`https://api.mux.com/video/v1/assets`, {
      params: {
        upload_id: uploadId,
      },
      auth: {
        username: config.access_token,
        password: config.secret_key,
      },
      headers: { 'Content-Type': 'application/json' },
    });

    const data = result.data.data;

    if (data.length > 0) {
      return data[0].id;
    } else {
      return undefined;
    }
  },
  async getDirectUploadUrl(
    playbackPolicy: MuxPlaybackPolicy,
    corsOrigin: string = '*'
  ): Promise<UploadInfoData> {
    const config = await Config.getConfig('general');

    const result = await handleAxiosRequest(
      axios({
        url: 'https://api.mux.com/video/v1/uploads',
        method: 'post',
        auth: {
          username: config.access_token,
          password: config.secret_key,
        },
        headers: { 'Content-Type': 'application/json' },
        data: {
          cors_origin: corsOrigin,
          new_asset_settings: { playback_policy: [playbackPolicy] },
        },
      })
    );

    const data = (result.data?.data ?? {}) as UploadInfoData;

    if (result.status !== 201 && !data.error) {
      data.error = {
        type: result.status.toString(),
        message: `${result.status} - ${result.statusText}`,
      };
    }

    return data;
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

  async createAsset(url: string) {
    const config = await Config.getConfig('general');

    const body = { input: url, playback_policy: ['public'] };

    const result = await axios('https://api.mux.com/video/v1/assets', {
      method: 'post',
      validateStatus: () => true,
      auth: {
        username: config.access_token,
        password: config.secret_key,
      },
      headers: { 'Content-Type': 'application/json' },
      data: body,
    });

    return result.data.data;
  },

  async updatePlaybackPolicy(
    asset: MuxAsset,
    playbackPolicy: MuxPlaybackPolicy
  ) {
    if (asset.playback_policy === playbackPolicy) {
      return {
        playbackId: asset.playback_id,
        playbackPolicy: asset.playback_policy,
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
    const config = await Config.getConfig('general');

    const createResponse = await axios(
      `https://api.mux.com/video/v1/assets/${assetId}/playback-ids`,
      {
        method: 'post',
        auth: {
          username: config.access_token,
          password: config.secret_key,
        },
        headers: { 'Content-Type': 'application/json' },
        data: { policy },
      }
    );

    if (createResponse.status !== 201) {
      throw new Error('Unable to create new playback id');
    }

    const data = createResponse.data.data;

    return {
      playbackId: data.id,
      playbackPolicy: data.policy,
    };
  },

  async deletePlaybackId(assetId: string, playbackId: string) {
    const config = await Config.getConfig('general');

    const response = await axios(
      `https://api.mux.com/video/v1/assets/${assetId}/playback-ids/${playbackId}`,
      {
        method: 'delete',
        auth: {
          username: config.access_token,
          password: config.secret_key,
        },
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (response.status !== 204) {
      throw new Error('Unable to delete playback id');
    }
  },

  async deleteAsset(assetId: string) {
    const config = await Config.getConfig('general');

    const muxResult = await axios(
      `https://api.mux.com/video/v1/assets/${assetId}`,
      {
        method: 'delete',
        auth: {
          username: config.access_token,
          password: config.secret_key,
        },
        headers: { 'Content-Type': 'application/json' },
      }
    );

    return muxResult.status === 204;
  },
});
