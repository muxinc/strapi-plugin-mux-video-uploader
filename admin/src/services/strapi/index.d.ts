import { MuxAsset, MuxAssetUpdate } from '../../../../types';
import { SearchVector, SortVector } from './types';
export declare type UploadOrigin = 'from_computer' | 'from_url';
export interface UploadInfo {
    title: string;
    media: File[] | string;
    origin: UploadOrigin;
}
declare const getIsConfigured: () => Promise<any>;
declare const setMuxSettings: (body: FormData) => Promise<Response>;
declare const submitUpload: (uploadInfo: UploadInfo) => Promise<any>;
declare const getMuxAssets: (searchVector?: SearchVector | undefined, sortVector?: SortVector | undefined, start?: number, limit?: number) => Promise<any>;
declare const setMuxAsset: (muxAsset: MuxAssetUpdate) => Promise<MuxAsset>;
declare const deleteMuxAsset: (muxAsset: MuxAsset) => Promise<any>;
export { getIsConfigured, setMuxSettings, submitUpload, getMuxAssets, setMuxAsset, deleteMuxAsset };
