import { typeFromMime } from './typeFromMime';

const removeFileExtension = (fileName) => {
  return fileName.replace(/\.[^/.]+$/, '');
};

export const rawFileToAsset = (rawFile, assetSource) => {
  return {
    size: rawFile.size / 1000,
    createdAt: new Date(rawFile.lastModified).toISOString(),
    name: rawFile.name,
    nameWithoutExtension: removeFileExtension(rawFile.name),
    source: assetSource,
    type: typeFromMime(rawFile.type),
    url: URL.createObjectURL(rawFile),
    ext: rawFile.name.split('.').pop(),
    mime: rawFile.type,
    rawFile,
    isLocal: true,
    duplicate: [],
  };
};
