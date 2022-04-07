import axios from "axios";

import { Config, handleAxiosRequest } from "./../utils";

export interface UploadInfoData {
  id: string;
  url: string;
  error?: { type: string; message: string };
}

export interface MuxService {
  getAssetIdByUploadId: (uploadId: string) => Promise<string>;
  getDirectUploadUrl: (corsOrigin?: string) => Promise<UploadInfoData>;
  createAsset: (url: string) => Promise<any>;
  deleteAsset: (assetId: string) => Promise<boolean>;
}

export default ({ strapi }: { strapi: any }) => ({
  async getAssetIdByUploadId(uploadId: string) {
    const config = await Config.getConfig("general");

    const result = await axios(`https://api.mux.com/video/v1/assets`, {
      params: {
        upload_id: uploadId,
      },
      auth: {
        username: config.access_token,
        password: config.secret_key,
      },
      headers: { "Content-Type": "application/json" },
    });

    return result.data.data[0].id;
  },
  async getDirectUploadUrl(corsOrigin: string = "*"): Promise<UploadInfoData> {
    const config = await Config.getConfig("general");

    const result = await handleAxiosRequest(
      axios({
        url: "https://api.mux.com/video/v1/uploads",
        method: "post",
        auth: {
          username: config.access_token,
          password: config.secret_key,
        },
        headers: { "Content-Type": "application/json" },
        data: {
          cors_origin: corsOrigin,
          new_asset_settings: { playback_policy: ["signed"] },
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
  async createAsset(url: string) {
    const config = await Config.getConfig("general");

    const body = { input: url, playback_policy: ["public"] };

    const result = await axios("https://api.mux.com/video/v1/assets", {
      method: "post",
      validateStatus: () => true,
      auth: {
        username: config.access_token,
        password: config.secret_key,
      },
      headers: { "Content-Type": "application/json" },
      data: body,
    });

    return result.data.data;
  },
  async deleteAsset(assetId: string) {
    const config = await Config.getConfig("general");

    const muxResult = await axios(
      `https://api.mux.com/video/v1/assets/${assetId}`,
      {
        method: "delete",
        auth: {
          username: config.access_token,
          password: config.secret_key,
        },
        headers: { "Content-Type": "application/json" },
      }
    );

    return muxResult.status === 204;
  },
});
