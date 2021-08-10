import { auth } from 'strapi-helper-plugin';
import { MuxAsset, MuxAssetUpdate } from '../../../../models/mux-asset';
import { SearchVector } from './types';

const SERVICE_URI = strapi.backendURL;

function getJwtToken() {
  return auth.getToken();
}

const getIsConfigured = () => {
  return fetch(
    `${SERVICE_URI}/mux-video-uploader/mux-settings`,
    {
      method: "GET",
      headers: { 'Authorization': `Bearer ${getJwtToken()}` }
    }).then((response) => response.json())
}

const setMuxSettings = (body: FormData) => {
  return fetch(`${SERVICE_URI}/mux-video-uploader/mux-settings`, {
    method: "POST",
    headers: { 'Authorization': `Bearer ${getJwtToken()}` },
    body
  });
}

const submitUpload = (title: string, origin: 'from_computer'|'from_url', media: File | string) => {
  const body = new FormData();
  body.append("title", title);

  let submitUrl;
    
  if(origin === 'from_url') {
    submitUrl = `${SERVICE_URI}/mux-video-uploader/submitRemoteUpload`;

    body.append("url", media);
  } else if(origin === 'from_computer') {
    submitUrl = `${SERVICE_URI}/mux-video-uploader/submitDirectUpload`;
  } else {
    throw new Error('Unable to determine upload origin');
  }

  return fetch(submitUrl, {
    method: "POST",
    headers: { 'Authorization': `Bearer ${getJwtToken()}` },
    body
  }).then((response) => response.json());
}

const getMuxAssets = (searchVector?:SearchVector, start = 0, limit = 10) => {
  let search;

  switch(searchVector?.field) {
    case 'by_title': {
      search = `&title_contains=${searchVector.value}`;

      break;
    }
    case 'by_asset_id': {
      search = `&asset_id_contains=${searchVector.value}`;

      break;
    }
    default: {
      search = '';
    }
  }

  const url = `${SERVICE_URI}/mux-video-uploader/mux-asset?_start=${start}&_limit=${limit}${search}`;

  return fetch(url, {
    method: "GET",
    headers: { 'Authorization': `Bearer ${getJwtToken()}` }
  }).then((response) => response.json());
};

const setMuxAsset = async (muxAsset:MuxAssetUpdate): Promise<MuxAsset> => {
  const url = `${SERVICE_URI}/mux-video-uploader/mux-asset/${muxAsset.id}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      'Authorization': `Bearer ${getJwtToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(muxAsset)
  });

  return await response.json();
};

export {
  getIsConfigured,
  setMuxSettings,
  submitUpload,
  getMuxAssets,
  setMuxAsset
};
