import type { MuxService } from '../services/mux';
import type { RobotsService } from '../services/robots';

const pluginId = 'mux-video-uploader';

export type ServiceName = 'mux' | 'robots';

export type ServiceType<T> = T extends 'mux' ? MuxService : T extends 'robots' ? RobotsService : never;

export const ASSET_MODEL = `plugin::${pluginId}.mux-asset` as const;
export const TEXT_TRACK_MODEL = `plugin::${pluginId}.mux-text-track` as const;
export const ROBOT_JOB_MODEL = `plugin::${pluginId}.mux-robot-job` as const;
