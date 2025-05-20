import type { MuxAsset } from '../../../../server/src/content-types/mux-asset/types';
import { ParsedCustomTextTrack } from '../../../../types/shared-types';
export default function CustomTextTrackForm({ custom_text_tracks, modifyCustomTextTracks, muxAsset, }: {
    custom_text_tracks: Partial<ParsedCustomTextTrack>[];
    modifyCustomTextTracks: (newValues: Partial<ParsedCustomTextTrack>[]) => void;
    muxAsset?: MuxAsset;
}): import("react/jsx-runtime").JSX.Element;
