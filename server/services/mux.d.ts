export interface UploadInfo {
    id: string;
}
export interface MuxService {
    getAssetIdByUploadId: (uploadId: string) => Promise<string>;
    getDirectUploadUrl: (corsOrigin?: string) => Promise<UploadInfo>;
    createAsset: (url: string) => Promise<any>;
    deleteAsset: (assetId: string) => Promise<boolean>;
}
declare const _default: ({ strapi }: {
    strapi: any;
}) => {
    getAssetIdByUploadId(uploadId: string): Promise<any>;
    getDirectUploadUrl(corsOrigin?: string): Promise<any>;
    createAsset(url: string): Promise<any>;
    deleteAsset(assetId: string): Promise<boolean>;
};
export default _default;
