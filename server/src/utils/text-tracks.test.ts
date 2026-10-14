import { beforeEach, describe, expect, it, vi } from 'vitest';

import { installFakeStrapi } from '../../../test/strapi';
import { MuxAsset } from '../content-types/mux-asset/types';
import { storedTextTrackToMuxTrack, updateTextTracks } from './text-tracks';

const subtitles = (id: string, language_code: string) => ({
  id,
  type: 'text',
  text_type: 'subtitles',
  text_source: 'uploaded',
  status: 'ready',
  language_code,
  name: language_code,
  closed_captions: false,
});

const muxAsset = {
  id: 1,
  asset_id: 'ast_1',
  playback_id: 'play_1',
  signed: false,
  asset_data: {
    id: 'ast_1',
    tracks: [
      { id: 'trk_video', type: 'video' },
      subtitles('trk_en', 'en'),
      subtitles('trk_fr', 'fr'),
      // Added by a Robots job after the form was opened.
      subtitles('trk_es', 'es'),
    ],
  },
} as unknown as MuxAsset;

const shown = (track: ReturnType<typeof subtitles>) => ({
  name: track.name,
  language_code: track.language_code,
  closed_captions: track.closed_captions,
  stored_track: track as any,
});

let deleteAssetTextTracks: ReturnType<typeof vi.fn>;

beforeEach(() => {
  deleteAssetTextTracks = vi.fn(async () => []);
  installFakeStrapi({
    services: {
      mux: () => ({ deleteAssetTextTracks, createAssetTextTracks: vi.fn(async () => []), signPlaybackId: vi.fn() }),
    },
  });
});

describe('updateTextTracks', () => {
  it('deletes a track the form showed and the person removed', async () => {
    await updateTextTracks(muxAsset, [shown(subtitles('trk_en', 'en'))], ['trk_en', 'trk_fr']);

    expect(deleteAssetTextTracks).toHaveBeenCalledWith('ast_1', ['trk_fr']);
  });

  it('never deletes a track the form never showed', async () => {
    await updateTextTracks(muxAsset, [shown(subtitles('trk_en', 'en'))], ['trk_en', 'trk_fr']);

    expect(deleteAssetTextTracks).not.toHaveBeenCalledWith('ast_1', expect.arrayContaining(['trk_es']));
  });

  it('deletes nothing when the request names no known tracks', async () => {
    await updateTextTracks(muxAsset, []);

    expect(deleteAssetTextTracks).toHaveBeenCalledWith('ast_1', []);
  });
});

describe('storedTextTrackToMuxTrack', () => {
  it("gives Mux a URL with the stored track's documentId, not its numeric id", () => {
    const track = storedTextTrackToMuxTrack({
      id: '2',
      documentId: 'b7nq4w0zs2kd9xv1mrp6tcfa',
      name: 'French',
      language_code: 'fr',
      closed_captions: false,
      file: { name: 'fr.vtt', contents: 'WEBVTT', type: 'text/vtt', size: 6 },
    } as any);

    expect(track.url).toMatch(/\/mux-video-uploader\/mux-text-tracks\/b7nq4w0zs2kd9xv1mrp6tcfa$/);
  });
});
