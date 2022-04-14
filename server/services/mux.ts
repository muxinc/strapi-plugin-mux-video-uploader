import axios from 'axios';
import Mux, { JWTOptions } from '@mux/mux-node';

import { Config, handleAxiosRequest } from './../utils';
import { MuxResourceType } from '../../types';

export interface UploadInfoData {
  id: string;
  url: string;
  error?: { type: string; message: string };
}

export interface MuxService {
  getAssetIdByUploadId: (uploadId: string) => Promise<string>;
  getDirectUploadUrl: (corsOrigin?: string) => Promise<UploadInfoData>;
  getPlaybackToken: (
    playbackId: string,
    type: MuxResourceType,
    params?: unknown
  ) => Promise<string>;
  createAsset: (url: string) => Promise<any>;
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

    return result.data.data[0].id;
  },
  async getDirectUploadUrl(corsOrigin: string = '*'): Promise<UploadInfoData> {
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
          new_asset_settings: { playback_policy: ['signed'] },
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
