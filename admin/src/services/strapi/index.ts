import { auth } from "@strapi/helper-plugin";
import { UploadInfoResponse } from "../../../../server/services/mux";

import { MuxAsset, MuxAssetUpdate } from "../../../../types";
import pluginId from "../../pluginId";
import { SearchVector, SortVector } from "./types";

export type UploadOrigin = "from_computer" | "from_url";

export interface UploadInfo {
  title: string;
  media: File[] | string;
  origin: UploadOrigin;
}

function getServiceUri() {
  return strapi.backendURL;
}

function getJwtToken() {
  return auth.getToken();
}

const getIsConfigured = () => {
  return fetch(`${getServiceUri()}/${pluginId}/mux-settings`, {
    method: "GET",
    headers: { Authorization: `Bearer ${getJwtToken()}` },
  }).then((response) => response.json());
};

const setMuxSettings = (body: FormData) => {
  return fetch(`${getServiceUri()}/${pluginId}/mux-settings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getJwtToken()}` },
    body,
  });
};

const submitUpload = async (
  uploadInfo: UploadInfo
): Promise<UploadInfoResponse> => {
  const body = new FormData();
  body.append("title", uploadInfo.title);

  let submitUrl;

  if (uploadInfo.origin === "from_url") {
    submitUrl = `${getServiceUri()}/${pluginId}/submitRemoteUpload`;

    body.append("url", uploadInfo.media as string);
  } else if (uploadInfo.origin === "from_computer") {
    submitUrl = `${getServiceUri()}/${pluginId}/submitDirectUpload`;
  } else {
    throw new Error("Unable to determine upload origin");
  }

  const response = await fetch(submitUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${getJwtToken()}` },
    body,
  });

  return await response.json();
};

const getMuxAssets = (
  searchVector?: SearchVector,
  sortVector?: SortVector,
  start = 0,
  limit = 10
) => {
  let search;

  switch (searchVector?.field) {
    case "by_title": {
      search = `&filter=title:${searchVector.value}`;

      break;
    }
    case "by_asset_id": {
      search = `&filter=asset_id:${searchVector.value}`;

      break;
    }
    default: {
      search = "";
    }
  }

  const sort = sortVector
    ? `&sort=${sortVector.field}&order=${sortVector.desc ? "desc" : "asc"}`
    : "";

  const url = `${getServiceUri()}/${pluginId}/mux-asset?start=${start}${sort}&limit=${limit}${search}`;

  return fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${getJwtToken()}` },
  }).then((response) => response.json());
};

const setMuxAsset = async (muxAsset: MuxAssetUpdate): Promise<MuxAsset> => {
  const url = `${getServiceUri()}/${pluginId}/mux-asset/${muxAsset.id}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${getJwtToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(muxAsset),
  });

  return await response.json();
};

const deleteMuxAsset = async (
  muxAsset: MuxAsset,
  deleteOnMux = true
): Promise<any> => {
  const body = new FormData();
  body.append("id", muxAsset.id.toString());
  body.append("asset_id", muxAsset.asset_id || "");
  body.append("upload_id", muxAsset.upload_id);
  body.append("delete_on_mux", deleteOnMux ? "true" : "false");

  const url = `${getServiceUri()}/${pluginId}/deleteMuxAsset`;

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${getJwtToken()}` },
    body,
  });

  return await response.json();
};

const getThumbnail = (playbackId: string | null) => {
  if (!playbackId) return undefined;
  return `${getServiceUri()}/${pluginId}/thumbnail/${playbackId}?width=512`;
};

export {
  getIsConfigured,
  setMuxSettings,
  submitUpload,
  getMuxAssets,
  setMuxAsset,
  deleteMuxAsset,
  getThumbnail,
};
