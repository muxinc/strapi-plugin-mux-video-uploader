import axios from "axios";
import { MuxAsset } from "../../types";

import { Config, handleAxiosRequest } from "./../utils";

export interface UploadInfo {
  id: string;
  url: string;
  muxAsset?: MuxAsset;
  error?: Error;
}

export interface MuxResponse<T> {
  status: number;
  statusText: string;
  data?: T;
}

export type UploadInfoResponse = MuxResponse<UploadInfo>;

export interface MuxService {
  getAssetIdByUploadId: (uploadId: string) => Promise<string>;
  getDirectUploadUrl: (corsOrigin?: string) => Promise<UploadInfoResponse>;
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
  async getDirectUploadUrl(
    corsOrigin: string = "*"
  ): Promise<UploadInfoResponse> {
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
          new_asset_settings: { playback_policy: ["public"] },
        },
      })
    );

    return {
      data: result.data?.data,
      status: result.status,
      statusText: result.statusText,
    };
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
