import React from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import styled from 'styled-components';
import MuxPlayer from '@mux/mux-player-react';
// @ts-expect-error - No types provided
import videojs from '@mux/videojs-kit';

import { MuxAsset } from '../../../../server/content-types/mux-asset/types';
import { useSignedTokens } from '../signed-tokens-provider';
import pluginPkg from '../../../../package.json';
import pluginId from '../../plugin-id';

import '@mux/videojs-kit/dist/index.css';

// THE FOLLOWING IS TEMPORARILY COMMENTED OUT DUE TO ISSUE WITH STRAPI
// ts-expect-error styled-components typings are off
// const MuxPlayerStyled = styled(MuxPlayer)`
//   width: 100%;
// `;

// const PreviewPlayer = (props: { muxAsset?: MuxAsset }) => {
//   const { muxAsset } = props;
//   const tokens = useSignedTokens();

//   if (!muxAsset?.playback_id || (muxAsset.signed && !tokens.video)) return null;

//   return (
//     <MuxPlayerStyled
//       playbackId={muxAsset.playback_id}
//       playback-token={tokens.video}
//       thumbnail-token={tokens.thumbnail}
//       storyboard-token={tokens.storyboard}
//       metadata={{
//         video_id: muxAsset.id,
//         video_title: muxAsset.title,
//         player_name: 'Strapi Admin Dashboard',
//         player_version: pluginPkg.version,
//         page_type: 'Preview Player',
//       }}
//       streamType="on-demand"
//     />
//   );
// };

const PreviewPlayer = (props: { muxAsset?: MuxAsset }) => {
  const { muxAsset } = props;

  const [posterUrl, setPosterUrl] = React.useState<string>();

  const { get } = useFetchClient();
  const tokens = useSignedTokens();

  React.useEffect(() => {
    if (!muxAsset) return;

    const player = videojs('mux-default', {
      timelineHoverPreviews: false,
      plugins: {
        mux: {
          data: {
            beaconUrl: 'https://inferred.litix.io',
            video_id: muxAsset.id,
            video_title: muxAsset.title,
            player_name: 'Strapi Admin Dashboard',
            player_version: pluginPkg.version,
            page_type: 'Preview Player',
          },
        },
      },
    });

    player.src({ type: 'video/mux', src: muxAsset.playback_id });
  }, []);

  React.useEffect(() => {
    if (!muxAsset?.playback_id || !tokens) return;

    const { playback_id } = muxAsset;

    get(`${pluginId}/thumbnail/${playback_id}`)
    .then(result => {
      const { data } = result;
      setPosterUrl(tokens.thumbnail ? `${data}?token=${tokens.thumbnail}` : data);
    });
  }, [muxAsset, tokens]);

  if (!muxAsset?.playback_id || (muxAsset.signed && !tokens.video)) return null;

  return (
    <video id="mux-default" className="video-js vjs-16-9" controls preload="auto" width="100%" poster={posterUrl} />
  );
};

export default PreviewPlayer;
