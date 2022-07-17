import React, { useEffect, useState } from 'react';

import styled from 'styled-components';
import MuxPlayer from '@mux-elements/mux-player-react';

import pluginPkg from './../../../../package.json';
import { MuxAsset } from '../../../../types';
import { getPlaybackToken, getThumbnail } from '../../services/strapi';

interface Props {
  muxAsset?: MuxAsset;
}

const MuxPlayerStyled = styled(MuxPlayer)`
  width: 100%;
`;

const PreviewPlayer = ({ muxAsset }:Props) => {
  const [videoToken, setVideoToken] = useState("");
  
  useEffect(() => {
    const generateVideoToken = async (playbackId: string) => {
      const token = await getPlaybackToken(playbackId, 'video');

      setVideoToken(token);
    }

    if (muxAsset && muxAsset.playback_id && muxAsset.playback_policy === 'signed') {
      generateVideoToken(muxAsset.playback_id);
    }
  });
  
  return (muxAsset && muxAsset.playback_id && (muxAsset.playback_policy === 'public' || videoToken) ?
    <MuxPlayerStyled
      playbackId={muxAsset.playback_id}
      tokens={{
        playback: videoToken
      }}
      poster={getThumbnail(muxAsset.playback_id)}
      metadata={{
        video_id: muxAsset.id,
        video_title: muxAsset.title,
        player_name: 'Strapi Admin Dashboard',
        player_version: pluginPkg.version,
        page_type: 'Preview Player'
      }}
      streamType="on-demand"
      playsInline
    /> : null
  );
};

export default PreviewPlayer;
