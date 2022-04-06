// import axios from "axios";
import { useRef, useState } from "react";
import { useMutation } from "react-query";
import { useIntl } from "react-intl";
import { createUpload } from "@mux/upchunk";
import getTrad from "../../../utils/getTrad";
import { submitUpload, deleteMuxAsset } from "../../../services/strapi";

const createUploadUrl = async (asset) => {
  const result = await submitUpload({
    title: asset.name,
    media: [asset.rawFile],
    origin: "from_computer",
  });

  const { status, statusText, data } = result;

  if (status !== 201) {
    if (data && data.muxAsset) {
      deleteMuxAsset(result.data.muxAsset, false);
    }

    if (data && data.error) {
      throw data.error;
    } else {
      throw new Error(`${status} - ${statusText}`);
    }
  }

  return result.data;
};

const uploadAsset = async (asset, abortSignal, onProgress) => {
  const result = await createUploadUrl(asset);
  const muxAsset = result.muxAsset;

  const upload = createUpload({
    endpoint: result.url,
    file: asset.rawFile,
  });

  upload.on("progress", (progressEvt) => {
    onProgress(Math.floor(progressEvt.detail));
  });

  const uploadPromise = new Promise((resolve, reject) => {
    upload.on("success", () => {
      onProgress(100);
      resolve(upload);
    });

    upload.on("error", (err) => {
      deleteMuxAsset(muxAsset, false);
      reject(err.detail);
    });

    abortSignal.addEventListener("abort", (event) => {
      upload.abort();

      deleteMuxAsset(muxAsset, false);

      reject(event.currentTarget.reason);
    });
  });

  return uploadPromise;
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
        id: getTrad("modal.upload.cancelled"),
        defaultMessage: "User cancelled mux-upload",
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
