import { useRef, useState } from 'react';
import { useMutation } from 'react-query';
import { useIntl } from 'react-intl';
import { createUpload } from '@mux/upchunk';
import getTrad from '../../../utils/getTrad';
import { submitUpload, deleteMuxAsset } from '../../../services/strapi';

const createUploadUrl = async (asset) => {
  const result = await submitUpload({
    title: asset.nameWithoutExtension,
    media: [asset.rawFile],
    origin: 'from_computer',
    playbackPolicy: asset.signed ? 'signed' : 'public',
  });

  if (result.data.error) {
    if (result.muxAsset) {
      deleteMuxAsset(result.muxAsset, false);
    }

    throw result.data.error;
  }

  return result;
};

const createMuxUpload = (asset, uploadInfo) => {
  const muxAsset = uploadInfo.muxAsset;

  try {
    return createUpload({
      endpoint: uploadInfo.data.url,
      file: asset.rawFile,
    });
  } catch (err) {
    if (muxAsset) {
      deleteMuxAsset(muxAsset, false);
    }

    throw err;
  }
};

const createUploadPromise = (upload, uploadInfo, abortSignal, onProgress) => {
  upload.on('progress', (progressEvt) => {
    onProgress(Math.floor(progressEvt.detail));
  });

  const uploadPromise = new Promise((resolve, reject) => {
    upload.on('success', () => {
      onProgress(100);
      resolve(upload);
    });

    upload.on('error', (err) => {
      deleteMuxAsset(uploadInfo.muxAsset, false);
      reject(err.detail);
    });

    abortSignal.addEventListener('abort', (event) => {
      upload.abort();

      deleteMuxAsset(uploadInfo.muxAsset, false);

      reject(event.currentTarget.reason);
    });
  });

  return uploadPromise;
};

const uploadAsset = async (asset, abortSignal, onProgress) => {
  const uploadInfo = await createUploadUrl(asset);
  const upload = createMuxUpload(asset, uploadInfo);

  return createUploadPromise(upload, uploadInfo, abortSignal, onProgress);
};

export const useUpload = () => {
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef(new AbortController());
  const { formatMessage } = useIntl();

  const mutation = useMutation((asset) =>
    uploadAsset(asset, abortControllerRef.current.signal, setProgress)
  );

  const upload = (asset) => mutation.mutateAsync(asset);
  const cancel = () =>
    abortControllerRef.current.abort(
      formatMessage({
        id: getTrad('modal.upload.cancelled'),
        defaultMessage: 'User cancelled mux-upload',
      })
    );

  return {
    upload,
    cancel,
    error: mutation.error,
    progress,
    status: mutation.status,
  };
};
