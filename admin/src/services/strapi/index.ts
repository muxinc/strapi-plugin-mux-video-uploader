import { auth } from 'strapi-helper-plugin';

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

const submitUpload = (title: string, method: 'url'|'upload', media: File | string) => {
  const body = new FormData();
  body.append("title", title);

  let submitUrl;
    
  if(method === 'url') {
    submitUrl = `${SERVICE_URI}/mux-video-uploader/submitRemoteUpload`;

    body.append("url", media);
  } else if(method === 'upload') {
    submitUrl = `${SERVICE_URI}/mux-video-uploader/submitDirectUpload`;
  } else {
    throw new Error('Unable to determine upload method');
  }

  return fetch(submitUrl, {
    method: "POST",
    headers: { 'Authorization': `Bearer ${getJwtToken()}` },
    body
  }).then((response) => response.json());
}

export {
  getIsConfigured,
  setMuxSettings,
  submitUpload
};
