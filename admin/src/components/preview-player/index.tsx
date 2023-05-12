import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import MuxPlayer from '@mux/mux-player-react';

import pluginPkg from './../../../../package.json';
import { getPlaybackToken } from '../../services/strapi';
import { MuxAsset } from '../../../../server/content-types/mux-asset/types';

interface Props {
  muxAsset?: MuxAsset;
}

const MuxPlayerStyled = styled(MuxPlayer)`
  width: 100%;
`;

const PreviewPlayer = (props: Props) => {
  const { muxAsset } = props;
  const [playbackToken, setPlaybackToken] = useState<string>('');
  const [thumbnailToken, setThumbnailToken] = useState<string>('');

  if (muxAsset === undefined || !muxAsset.playback_id) return null;

  useEffect(() => {
    if (muxAsset.signed) {
      getPlaybackToken(muxAsset.playback_id, 'video').then((data) => setPlaybackToken(data.token));
      getPlaybackToken(muxAsset.playback_id, 'thumbnail').then((data) => setThumbnailToken(data.token));
    }
  }, []);

  return (
    <MuxPlayerStyled
      playbackId={muxAsset.playback_id}
      playback-token={playbackToken}
      thumbnail-token={thumbnailToken}
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
