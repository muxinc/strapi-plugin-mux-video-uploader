import { MuxService } from '../services/mux';

const pluginId = 'mux-video-uploader';

export type ServiceName = 'mux';

export type ServiceType<T> = T extends 'mux' ? MuxService : never;

export const ASSET_MODEL = `plugin::${pluginId}.mux-asset` as const;
export const TEXT_TRACK_MODEL = `plugin::${pluginId}.mux-text-track` as const;
