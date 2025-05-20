import { MuxService } from '../services/mux';
export type ServiceName = 'mux';
export type ServiceType<T> = T extends 'mux' ? MuxService : never;
export declare const ASSET_MODEL: "plugin::mux-video-uploader.mux-asset";
export declare const TEXT_TRACK_MODEL: "plugin::mux-video-uploader.mux-text-track";
