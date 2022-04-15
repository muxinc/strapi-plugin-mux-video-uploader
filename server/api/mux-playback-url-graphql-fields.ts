import { MuxResourceType } from '../../types';
import { getService } from '../utils';

const signPlaybackUrl = async (
  baseUrl: string,
  playbackId: string,
  type: MuxResourceType,
  params?: { [key: string]: unknown }
) => {
  const token = await getService('mux').getPlaybackToken(
    playbackId,
    type,
    params
  );

  const url = new URL(baseUrl);
  url.searchParams.append('token', token);

  return url.href;
};

export const addMuxPlaybackUrlFieldsToGraphQlSchema = ({ nexus }: any) => ({
  types: [
    nexus.extendType({
      type: 'MuxVideoUploaderMuxAsset',
      definition(t: any) {
        t.field('playback_url', {
          type: 'String',
          resolve: async (root: any) => {
            const playbackId = root.playback_id;
            if (playbackId) {
              return signPlaybackUrl(
                `https://stream.mux.com/${playbackId}.m3u8`,
                playbackId,
                'video'
              );
            } else {
              return undefined;
            }
          },
        }),
          t.field('thumbnail_url', {
            type: 'String',
            args: {
              width: nexus.intArg(
                'The width of the thumbnail in pixels. Defaults to the width of the video.'
              ),
              time: nexus.intArg(
                'The time (in seconds) of the video timeline where the image should be pulled. Defaults to the middle of the video'
              ),
            },
            resolve: async (root: any, args: any) => {
              const playbackId = root.playback_id;
              if (playbackId) {
                return signPlaybackUrl(
                  `https://image.mux.com/${playbackId}/thumbnail.jpg`,
                  playbackId,
                  'thumbnail',
                  args
                );
              } else {
                return undefined;
              }
            },
          });
      },
    }),
  ],
});
