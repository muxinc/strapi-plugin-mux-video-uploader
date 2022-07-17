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
  const [playbackId, setPlaybackId] = useState("");
  
  useEffect(() => {
    const generateSignedSrc = async (playbackId: string) => {
      const token = await getPlaybackToken(playbackId, 'video');
      
      return `${playbackId}?token=${token}`;
    }

    const generateVideoSrc = async () => {
      const src = muxAsset && muxAsset.playback_id && muxAsset.playback_policy === 'signed' ?
        await generateSignedSrc(muxAsset.playback_id) :
        muxAsset?.playback_id;

      if(src) {
        setPlaybackId(src);
      }
    }

    generateVideoSrc();
  });

  return (muxAsset && muxAsset.playback_id && playbackId &&
    <MuxPlayerStyled
      playbackId={playbackId}
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
    />
  );
};

export default PreviewPlayer;
