declare const _default: {
    mux: ({ strapi }: {
        strapi: any;
    }) => {
        getAssetIdByUploadId(uploadId: string): Promise<any>;
        getDirectUploadUrl(corsOrigin?: string): Promise<any>;
        createAsset(url: string): Promise<any>;
        deleteAsset(assetId: string): Promise<boolean>;
    };
};
export = _default;
