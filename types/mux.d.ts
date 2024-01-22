import { TextTrack as MuxTextTrack } from '@mux/mux-node';

declare module '@mux/mux-node' {
  export interface TextTrack extends MuxTextTrack {
    text_source?: 'generated_vod';
  }
}
