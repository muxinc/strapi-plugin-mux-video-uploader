import { MuxAsset } from '../content-types/mux-asset/types';
export declare const resolveMuxAsset: (filters: MuxAssetFilter) => Promise<MuxAsset>;
export interface MuxAssetFilter {
    upload_id?: string;
    asset_id?: string;
    documentId?: string;
    id?: string;
}
