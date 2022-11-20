import Mux from '@mux/mux-node';
import { RequestOptions } from '@mux/mux-node/dist/RequestOptions';
import { Asset, Upload } from '@mux/mux-node/dist/video/domain';

import pluginPkg from './../../package.json';
import { Config } from "./../utils";

export interface MuxService {
  getAssetById: (assetId: string) => Promise<Asset>;
  getAssetByUploadId: (uploadId: string) => Promise<Asset>;
  getDirectUploadUrl: (corsOrigin?: string) => Promise<Upload>;
  createAsset: (url: string) => Promise<Asset>;
  deleteAsset: (assetId: string) => Promise<boolean>;
}

const getMuxClient = async () => {
  const { access_token, secret_key } = await Config.getConfig('general');
  const options:RequestOptions = { platform: { name: 'Strapi CMS', version: pluginPkg.version } };

  return new Mux(access_token, secret_key, options);
}

export default ({ strapi }: { strapi: any }) => ({
  async getAssetById(assetId: string): Promise<Asset> {
    const { Video } = await getMuxClient();

    return await Video.Assets.get(assetId);
  },
  async getAssetByUploadId(uploadId:string): Promise<Asset> {
    const { Video } = await getMuxClient();

    const assets = await Video.Assets.list({ upload_id: uploadId });

    return assets[0];
  },
  async getDirectUploadUrl(corsOrigin:string = "*"): Promise<Upload> {
    const { Video } = await getMuxClient();

    return Video.Uploads.create({
      cors_origin: corsOrigin,
      new_asset_settings: {
        playback_policy: ['public']
      }
    });
  },
  async createAsset(url:string): Promise<Asset> {
    const { Video } = await getMuxClient();

    return Video.Assets.create({
      input: url,
      playback_policy: ['public']
    });
  },
  async deleteAsset(assetId:string): Promise<boolean> {
    const { Video } = await getMuxClient();

    await Video.Assets.del(assetId);
    
    return true;
  }
});
