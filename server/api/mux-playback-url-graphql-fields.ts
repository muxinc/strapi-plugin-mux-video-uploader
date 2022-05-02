import { MuxPlaybackPolicy, MuxResourceType } from '../../types';
import { getService } from '../utils';

type UrlParams = { [key: string]: unknown };

const appendParamsToUrl = (baseUrl: string, params?: UrlParams) => {
  const url = new URL(baseUrl);

  if (params) {
    for (const entry of Object.entries(params)) {
      url.searchParams.append(entry[0], String(entry[1]));
    }
  }

  return url.href;
};

const signPlaybackUrl = async (
  baseUrl: string,
  playbackId: string,
  type: MuxResourceType,
  params?: UrlParams
) => {
  const token = await getService('mux').getPlaybackToken(
    playbackId,
    type,
    params
  );

  return appendParamsToUrl(baseUrl, { token });
};

const generatePlaybackUrl = async (
  baseUrl: string,
  playbackId: string,
  type: MuxResourceType,
  playbackPolicy: MuxPlaybackPolicy,
  params?: UrlParams
) => {
  if (playbackPolicy === 'signed') {
    return signPlaybackUrl(baseUrl, playbackId, type, params);
  } else {
    return appendParamsToUrl(baseUrl, params);
  }
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
            const playbackPolicy = root.playback_policy;

            if (playbackId) {
              return generatePlaybackUrl(
                `https://stream.mux.com/${playbackId}.m3u8`,
                playbackId,
                'video',
                playbackPolicy
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
              const playbackPolicy = root.playback_policy;

              if (playbackId) {
                return generatePlaybackUrl(
                  `https://image.mux.com/${playbackId}/thumbnail.jpg`,
                  playbackId,
                  'thumbnail',
                  playbackPolicy,
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
