import Mux from '@mux/mux-node';
import { Asset, Upload } from '@mux/mux-node/cjs/video/domain';

import { Config } from "./../utils";

export interface MuxService {
  getAssetIdByUploadId: (uploadId: string) => Promise<string>;
  getDirectUploadUrl: (corsOrigin?: string) => Promise<Upload>;
  createAsset: (url: string) => Promise<Asset>;
  deleteAsset: (assetId: string) => Promise<boolean>;
} 

export default ({ strapi }: { strapi: any }) => ({
  async getAssetIdByUploadId(uploadId:string): Promise<string> {
    const { access_token, secret_key } = await Config.getConfig('general');
    const { Video } = new Mux(access_token, secret_key);

    const assets = await Video.Assets.list({ upload_id: uploadId });

    return assets[0].id;
  },
  async getDirectUploadUrl(corsOrigin:string = "*"): Promise<Upload> {
    const { access_token, secret_key } = await Config.getConfig('general');
    const { Video } = new Mux(access_token, secret_key);

    return Video.Uploads.create({
      cors_origin: corsOrigin,
      new_asset_settings: {
        playback_policy: ['public']
      }
    });
  },
  async createAsset(url:string): Promise<Asset> {
    const { access_token, secret_key } = await Config.getConfig('general');
    const { Video } = new Mux(access_token, secret_key);

    return Video.Assets.create({
      input: url,
      playback_policy: ['public']
    });
  },
  async deleteAsset(assetId:string): Promise<boolean> {
    const { access_token, secret_key } = await Config.getConfig('general');
    const { Video } = new Mux(access_token, secret_key);

    await Video.Assets.del(assetId);
    
    return true;
  }
});
