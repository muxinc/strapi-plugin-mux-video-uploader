import axios from 'axios';

import { Config } from "./../utils";

export default ({ strapi }: { strapi: any }) => ({
  async getAssetIdByUploadId(uploadId:string) {
    const config = await Config.getConfig('general');

    const result = await axios(`https://api.mux.com/video/v1/assets`, {
      params: {
        upload_id: uploadId
      },
      auth: {
        username: config.access_token,
        password: config.secret_key
      },
      headers: { 'Content-Type': 'application/json' }
    });

    return result.data.data[0].id;
  },
  async getDirectUploadUrl(corsOrigin:string = "*") {
    const config = await Config.getConfig('general');

    const result = await axios({
      url: 'https://api.mux.com/video/v1/uploads',
      method: "post",
      auth: {
        username: config.access_token,
        password: config.secret_key
      },
      headers: { 'Content-Type': 'application/json' },
      data: { "cors_origin": corsOrigin, "new_asset_settings": { "playback_policy": ["public"] } }
    });

    return result.data.data;
  },
  async createAsset(url:string) {
    const config = await Config.getConfig('general');

    const body = { "input": url, "playback_policy": ["public"] };

    const result = await axios('https://api.mux.com/video/v1/assets', {
      method: "post",
      validateStatus: () => true,
      auth: {
        username: config.access_token,
        password: config.secret_key
      },
      headers: { 'Content-Type': 'application/json' },
      data: body
    });

    return result.data.data;
  },
  async deleteAsset(assetId:string) {
    const config = await Config.getConfig('general');
    
    const muxResult = await axios(`https://api.mux.com/video/v1/assets/${assetId}`, {
      method: "delete",
      auth: {
        username: config.access_token,
        password: config.secret_key
      },
      headers: { 'Content-Type': 'application/json' }
    });

    return muxResult.status === 204;
  }
});
