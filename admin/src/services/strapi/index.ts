import { auth } from '@strapi/helper-plugin';
import { MuxAsset, MuxAssetUpdate } from '../../../../server/content-types/mux-asset/types';

import { type RequestedUploadData } from '../../../../types/shared-types';
import pluginId from '../../plugin-id';
import { SearchVector, SortVector } from './types';

function getServiceUri() {
  // @ts-ignore
  return strapi.backendURL;
}

function getJwtToken() {
  return auth.getToken();
}

const getIsConfigured = () => {
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

const submitUpload = async (uploadInfo: RequestedUploadData) => {
  const submitEndpoint = uploadInfo.upload_type === 'url' ? 'submitRemoteUpload' : 'submitDirectUpload';

  const response = await fetch(`${getServiceUri()}/${pluginId}/${submitEndpoint}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getJwtToken()}`, ContentType: 'application/json' },
    body: JSON.stringify(uploadInfo),
  });

  return (await response.json()) as {
    statusCode: number;
    data: {
      errors?: any;
    };
    url?: string;
  };
};

const getMuxAssets = (searchVector?: SearchVector, sortVector?: SortVector, start = 0, limit = 10) => {
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

  const sort = sortVector ? `&sort=${sortVector.field}&order=${sortVector.desc ? 'desc' : 'asc'}` : '';

  const url = `${getServiceUri()}/${pluginId}/mux-asset?start=${start}${sort}&limit=${limit}${search}`;

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

const deleteMuxAsset = async (muxAsset: MuxAsset): Promise<any> => {
  const body = JSON.stringify({
    id: muxAsset.id,
    delete_on_mux: true,
  });

  const url = `${getServiceUri()}/${pluginId}/deleteMuxAsset`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getJwtToken()}`,
    },
    body,
  });

  return await response.json();
};

const getThumbnail = (playbackId: string | null, token?: string | null) => {
  if (!playbackId) return undefined;
  const tokenOut = token ? `?token=${token}` : '';
  return `${getServiceUri()}/${pluginId}/thumbnail/${playbackId}${tokenOut}`;
};

const getPlaybackToken = async (playbackId: string | null, type: string) => {
  const url = `${getServiceUri()}/${pluginId}/sign/${playbackId}?type=${type}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getJwtToken()}`,
      'Content-Type': 'application/json',
    },
  });

  return await response.json();
};

const getMuxThumbnail = async (playbackId: string | null) => {
  if (!playbackId) return undefined;
  const token = await getPlaybackToken(playbackId, 'thumbnail');
  return `//image.mux.com/${playbackId}/thumbnail.jpg?token=${token.token}`;
};

export {
  deleteMuxAsset,
  getIsConfigured,
  getMuxAssets,
  getMuxThumbnail,
  getPlaybackToken,
  getThumbnail,
  setMuxAsset,
  setMuxSettings,
  submitUpload,
};
