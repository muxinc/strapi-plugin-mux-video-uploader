import type Mux from '@mux/mux-node';
import { z } from 'zod';
import { getService } from '.';
import { ParsedCustomTextTrack, StoredTextTrack, TextTrackFile } from '../../../types/shared-types';
import { MuxAsset, MuxAssetUpdate } from '../content-types/mux-asset/types';
import { TEXT_TRACK_MODEL } from './types';

const pluginId = 'mux-video-uploader';

export async function storeTextTracks(custom_text_tracks: ParsedCustomTextTrack[]): Promise<StoredTextTrack[]> {
  // @ts-expect-error - v5 migration
  return await Promise.all(
    custom_text_tracks.map(async (track) => {
      const { id } = await strapi.entityService.create(TEXT_TRACK_MODEL, { data: track });

      return { ...track, id };
    })
  );
}

export function storedTextTrackToMuxTrack(track: StoredTextTrack): Mux.Video.AssetCreateTrackParams {
  return {
    type: 'text',
    text_type: 'subtitles',
    closed_captions: track.closed_captions,
    language_code: track.language_code,
    name: track.closed_captions ? `${track.name} (CC)` : track.name,
    url: getStrapiTextTrackUrl(track.id),
  };
}

const BASE_URL = (strapi as any).backendURL;

function getStrapiTextTrackUrl(id: StoredTextTrack['id']) {
  return `${BASE_URL}/${pluginId}/mux-text-tracks/${id}`;
}

export function getMuxTextTrackUrl({
  playback_id,
  track,
  signedToken,
}: {
  playback_id: MuxAsset['playback_id'];
  track: Pick<Mux.Video.Track, 'id'>;
  signedToken?: string;
}) {
  return `https://stream.mux.com/${playback_id}/text/${track.id}.vtt${signedToken ? `?token=${signedToken}` : ''}`;
}

/**
 * Deletes, creates or updates (deleting & recreating) modified subtitles & captions.
 * Doesn't modify the `mux-asset`'s `asset_data` in the Strapi database (that's handled by Mux's webhook handlers).
 */
export async function updateTextTracks(
  muxAsset: MuxAsset,
  newTracks: MuxAssetUpdate['custom_text_tracks']
): Promise<MuxAsset['asset_data'] | undefined> {
  if (!newTracks || !muxAsset.asset_id || !muxAsset.playback_id) return undefined;

  const { asset_id, playback_id } = muxAsset;

  const { token } = await (async () => {
    if (!muxAsset.signed) return { token: undefined };

    return getService('mux').signPlaybackId(playback_id, 'video');
  })();

  /**
   * #1 PARSE EXISTING, REMOVED, ADDED AND UPDATED TRACKS
   */
  const existingTracks = muxAsset.asset_data?.tracks || [];

  const removedTracks =
    existingTracks.filter(
      (track) =>
        track.type === 'text' &&
        track.text_type === 'subtitles' &&
        !newTracks.find((t) => t.stored_track?.id === track.id)
    ) || [];

  const addedTracks = newTracks.filter((track) => !existingTracks.find((t) => t.id === track.stored_track?.id));

  const updatedTracks = newTracks.flatMap((track) => {
    const existingTrack = existingTracks.find(
      (t) => t.id === track.stored_track?.id && t.type === 'text' && t.text_type === 'subtitles'
    );

    if (!existingTrack) return [];

    const isDifferent = [
      existingTrack.language_code !== track.language_code,
      existingTrack.name !== track.name,
      // Ignore closed_captions for generated captions/subtitles
      existingTrack.text_source !== 'generated_vod' && existingTrack.closed_captions !== track.closed_captions,
      track.file?.contents,
    ].some(Boolean);

    if (!isDifferent) return [];

    return {
      track,
      prevId: existingTrack.id,
    };
  });

  /**
   * #2 DOWNLOAD FILES FOR TRACKS ALREADY IN MUX
   *
   * For tracks that were updated but didn't include a new user-sent file,
   * we can't point to a stored track in Strapi. Instead, we need to point to the
   * track hosted in Mux itself.
   **/
  const alreadyInMuxWithoutFile = await Promise.all(
    updatedTracks.flatMap((t) => {
      const track_id = t.track.stored_track?.id;
      // If not a stored track, ignore
      if (t.track.file || !track_id) return [];

      return new Promise<(typeof updatedTracks)[number]>(async (resolve, reject) => {
        try {
          const muxTrackRes = await fetch(
            getMuxTextTrackUrl({ playback_id, track: { id: track_id }, signedToken: token })
          );

          if (muxTrackRes.status !== 200) throw new Error(muxTrackRes.statusText);

          const contents = await muxTrackRes.text();
          const type = muxTrackRes.headers.get('content-type') || 'text/vtt';

          const contentLength = muxTrackRes.headers.get('content-length');

          const file = TextTrackFile.parse({
            contents,
            type,
            name: t.track.name,
            size: contentLength && !Number.isNaN(Number(contentLength)) ? Number(contentLength) : contents.length,
          } as z.input<typeof TextTrackFile>);

          resolve({
            ...t,
            track: {
              ...t.track,
              file,
            },
          });
        } catch (error) {
          reject(error);
        }
      });
    })
  );

  /**
   * #3 STORE TRACKS IN STRAPI
   *
   * So Mux's services can fetch them via URL
   */
  const newStoredForDownload = await (async () => {
    try {
      return await storeTextTracks(
        [...addedTracks, ...updatedTracks.map((t) => t.track), ...alreadyInMuxWithoutFile.map((t) => t.track)].filter(
          (t) => t.file
        ) as ParsedCustomTextTrack[]
      );
    } catch (error) {
      console.error('\n\n[updateTextTracks / storeTextTracks]', error);
      throw new Error('Unable to store text tracks');
    }
  })();

  /**
   * #4 DELETE EXISTING TRACKS IN MUX
   *
   * Although creating the new ones first would yield a better safety net,
   * we delete first because Mux doesn't allow tracks with duplicate language codes.
   */
  await (async () => {
    try {
      await getService('mux').deleteAssetTextTracks(asset_id, [
        ...removedTracks.flatMap((t) => t.id || []),
        ...updatedTracks.flatMap((t) => t.prevId || []),
      ]);
    } catch (error) {
      console.error('\n\n[updateTextTracks / deleteAssetTextTracks]', error);
      throw new Error('Unable to delete text tracks in Mux');
    }
  })();

  /**
   * #5 CREATE TRACKS IN MUX
   *
   * Provide an URL so Mux's services can fetch them remotely.
   */
  await (async () => {
    try {
      await getService('mux').createAssetTextTracks(asset_id, newStoredForDownload.map(storedTextTrackToMuxTrack));
    } catch (error) {
      console.error('\n\n[updateTextTracks / createAssetTextTracks]', error);
      throw new Error('Unable to create text tracks in Mux');
    }
  })();
}
