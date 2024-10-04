import React from 'react';
import styled from 'styled-components';
import MuxPlayer from '@mux/mux-player-react';

import { MuxAsset } from '../../../../server/src/content-types/mux-asset/types';
import { useSignedTokens } from '../signed-tokens-provider';
import pluginPkg from '../../../../package.json';
import { PLUGIN_ID } from '../../pluginId';

// THE FOLLOWING IS TEMPORARILY COMMENTED OUT DUE TO ISSUE WITH STRAPI
// ts-expect-error styled-components typings are off
const MuxPlayerStyled = styled(MuxPlayer)`
  width: 100%;
`;

const PreviewPlayer = (props: { muxAsset?: MuxAsset }) => {
  const { muxAsset } = props;

  const [posterUrl, setPosterUrl] = React.useState<string>(
    // Empty pixel
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  );

  const tokens = useSignedTokens();

  const init = async (muxAsset: MuxAsset) => {
    const { playback_id } = muxAsset;
    if (muxAsset.playback_id !== null && muxAsset.signed) {
      setPosterUrl(`/${PLUGIN_ID}/thumbnail/${playback_id}?token=${tokens.thumbnail}`);
    } else if (muxAsset.playback_id !== null) {
      setPosterUrl(`/${PLUGIN_ID}/thumbnail/${playback_id}`);
    }
  };

  React.useEffect(() => {
    muxAsset && init(muxAsset);
  }, []);

  if (!muxAsset?.playback_id || (muxAsset.signed && !tokens.video)) return null;

  return (
    <MuxPlayerStyled
      playbackId={muxAsset.playback_id}
      poster={posterUrl}
      playback-token={tokens.video}
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
