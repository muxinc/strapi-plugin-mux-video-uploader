import { auth } from '@strapi/helper-plugin';
import { UploadInfoData } from '../../../../server/services/mux';

import {
  MuxAsset,
  MuxAssetUpdate,
  MuxPlaybackPolicy,
  MuxResourceType,
} from '../../../../types';
import pluginId from '../../pluginId';
import { SearchVector, SortVector } from './types';

export type UploadOrigin = 'from_computer' | 'from_url';

export interface UploadInfo {
  title: string;
  media: File[] | string;
  origin: UploadOrigin;
  playbackPolicy: MuxPlaybackPolicy;
}

interface UploadInfoResponse {
  data: UploadInfoData;
  muxAsset: MuxAsset;
}

function getServiceUri() {
  return strapi.backendURL;
}

function getJwtToken() {
  return auth.getToken();
}

const getIsConfigured = () => {
  return fetch(`${getServiceUri()}/${pluginId}/mux-settings/configured`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${getJwtToken()}` },
  }).then((response) => response.json());
};

const getMuxSettings = () => {
  return fetch(`${getServiceUri()}/${pluginId}/mux-settings`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${getJwtToken()}` },
  }).then((response) => response.json());
};

const setMuxSettings = (body: FormData) => {
  return fetch(`${getServiceUri()}/${pluginId}/mux-settings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getJwtToken()}` },
    body,
  });
};

const createMuxAssetShells = async (titles: string[]) => {
  const body = new FormData();

  for (const title of titles) {
    body.append('titles', title);
  }

  const response = await fetch(`${getServiceUri()}/${pluginId}/mux-assets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getJwtToken()}` },
    body,
  });

  return await response.json();
};

const submitUpload = async (
  uploadInfo: UploadInfo
): Promise<UploadInfoResponse> => {
  const body = new FormData();
  body.append('title', uploadInfo.title);
  body.append('playback_policy', uploadInfo.playbackPolicy);

  let submitUrl;

  if (uploadInfo.origin === 'from_url') {
    submitUrl = `${getServiceUri()}/${pluginId}/submitRemoteUpload`;

    body.append('url', uploadInfo.media as string);
  } else if (uploadInfo.origin === 'from_computer') {
    submitUrl = `${getServiceUri()}/${pluginId}/submitDirectUpload`;
  } else {
    throw new Error('Unable to determine upload origin');
  }

  const response = await fetch(submitUrl, {
    method: 'POST',
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
    case 'by_title': {
      search = `&filters[title][$containsi]=${searchVector.value}`;

      break;
    }
    case 'by_asset_id': {
      search = `&filters[asset_id][$containsi]=${searchVector.value}`;

      break;
    }
    default: {
      search = '';
    }
  }

  const sort = sortVector
    ? `&sort=${sortVector.field}&order=${sortVector.desc ? 'desc' : 'asc'}`
    : '';

  const limitParam = limit ? `&limit=${limit}` : '';

  const url = `${getServiceUri()}/${pluginId}/mux-asset?start=${start}${sort}${limitParam}${search}`;

  return fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${getJwtToken()}` },
  }).then((response) => response.json());
};

const setMuxAsset = async (muxAsset: MuxAssetUpdate): Promise<MuxAsset> => {
  const url = `${getServiceUri()}/${pluginId}/mux-asset/${muxAsset.id}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${getJwtToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(muxAsset),
  });

  return await response.json();
};

const deleteMuxAsset = async (muxAsset: MuxAsset, deleteOnMux = true): Promise<any> => {
  const body = JSON.stringify({
    id: muxAsset.id,
    delete_on_mux: deleteOnMux
  });

  const url = `${getServiceUri()}/${pluginId}/deleteMuxAsset`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getJwtToken()}`
    },
    body
  });

  return await response.json();
};

const getThumbnail = (playbackId: string | null) => {
  if (!playbackId) return undefined;
  return `${getServiceUri()}/${pluginId}/thumbnail/${playbackId}?width=512`;
};

const getPlaybackToken = (
  playbackId: string,
  type: MuxResourceType,
  params?: { [key: string]: unknown }
) => {
  let url = `${getServiceUri()}/${pluginId}/playback-token/${playbackId}/${type}`;

  if (params) {
    const queryString = Object.entries(params)
      .map((param) => `${param[0]}=${String(param[1])}`)
      .join('&');

    url = `${url}?${queryString}`;
  }

  return fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${getJwtToken()}` },
  }).then((response) => response.text());
};

export {
  getIsConfigured,
  getMuxSettings,
  setMuxSettings,
  createMuxAssetShells,
  submitUpload,
  getMuxAssets,
  setMuxAsset,
  deleteMuxAsset,
  getThumbnail,
  getPlaybackToken,
};
