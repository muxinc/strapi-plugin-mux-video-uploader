import React from 'react';
import styled from 'styled-components';
import MuxPlayer from '@mux-elements/mux-player-react';

import pluginPkg from './../../../../package.json';
import { getThumbnail } from '../../services/strapi';
import { MuxAsset } from '../../../../server/content-types/mux-asset/types';

interface Props {
  muxAsset?: MuxAsset;
}

const MuxPlayerStyled = styled(MuxPlayer)`
  width: 100%;
`;

const PreviewPlayer = (props:Props) => {
  const { muxAsset } = props;

  if(muxAsset === undefined || !muxAsset.playback_id) return null;
  
  const posterUrl = getThumbnail(muxAsset.playback_id);

  return (
    <MuxPlayerStyled
      playbackId={muxAsset.playback_id}
      poster={posterUrl}
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
