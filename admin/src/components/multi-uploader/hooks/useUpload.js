// import axios from "axios";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { useIntl } from "react-intl";
import { createUpload } from "@mux/upchunk";
import getTrad from "../../../utils/getTrad";
import { submitUpload } from "../../../services/strapi";

const uploadAsset = async (asset, abortSignal, onProgress) => {
  console.log(asset);

  const result = await submitUpload({
    title: asset.name,
    media: [asset.rawFile],
    origin: "from_computer",
  });

  const { statusCode, data } = result;

  if (statusCode && statusCode !== 200) {
    throw data?.errors;
  }

  console.log(result, result.data, result.url);

  const upload = createUpload({ endpoint: result.url, file: asset.rawFile });

  upload.on("progress", (progressEvt) => {
    onProgress(Math.floor(progressEvt.detail));
  });

  const uploadPromise = new Promise((resolve, reject) => {
    upload.on("success", () => {
      onProgress(100);
      resolve(upload);
    });

    upload.on("error", (err) => reject(err.detail));

    abortSignal.addEventListener("abort", (reason) => {
      upload.abort();
      reject(reason);
    });
  });

  return uploadPromise;

  // const { rawFile, caption, name, alternativeText } = asset;
  // const formData = new FormData();
  // formData.append("files", rawFile);
  // formData.append(
  //   "fileInfo",
  //   JSON.stringify({
  //     name,
  //     caption: caption || name,
  //     alternativeText: alternativeText || name,
  //   })
  // );
  // return axiosInstance({
  //   method: "post",
  //   url: endpoint,
  //   headers: {},
  //   data: formData,
  //   cancelToken: cancelToken.token,
  //   onUploadProgress({ total, loaded }) {
  //     onProgress((loaded / total) * 100);
  //   },
  // }).then((res) => res.data);
};

export const useUpload = () => {
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef(new AbortController());
  const { formatMessage } = useIntl();
  // const queryClient = useQueryClient();

  const mutation = useMutation(
    (asset) =>
      uploadAsset(asset, abortControllerRef.current.signal, setProgress)
    // {
    //   onSuccess: () => {
    //     queryClient.refetchQueries(["assets"], { active: true });
    //     queryClient.refetchQueries(["asset-count"], { active: true });
    //   },
    // }
  );

  const upload = (asset) => mutation.mutateAsync(asset);
  const cancel = () =>
    abortControllerRef.current.abort(
      formatMessage({
        id: getTrad("modal.upload.cancelled"),
        defaultMessage: "",
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
