import MuxPlayer from '@mux/mux-player-react';
import React from 'react';
import styled from 'styled-components';

import { MuxAsset } from '../../../../server/content-types/mux-asset/types';
import { useSignedTokens } from '../signed-tokens-provider';
import pluginPkg from '../../../../package.json';

// @ts-expect-error styled-components typings are off
const MuxPlayerStyled = styled(MuxPlayer)`
  width: 100%;
`;

const PreviewPlayer = (props: { muxAsset?: MuxAsset }) => {
  const { muxAsset } = props;
  const tokens = useSignedTokens();

  if (!muxAsset?.playback_id || (muxAsset.signed && !tokens.video)) return null;

  return (
    <MuxPlayerStyled
      playbackId={muxAsset.playback_id}
      playback-token={tokens.video}
      thumbnail-token={tokens.thumbnail}
      storyboard-token={tokens.storyboard}
      metadata={{
        video_id: muxAsset.id,
        video_title: muxAsset.title,
        player_name: 'Strapi Admin Dashboard',
        player_version: pluginPkg.version,
        page_type: 'Preview Player',
      }}
      streamType="on-demand"
    />
  );
};

export default PreviewPlayer;
