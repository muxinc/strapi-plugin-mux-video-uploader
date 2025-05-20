import React from 'react';
import styled from 'styled-components';
import MuxPlayer from '@mux/mux-player-react';

import { MuxAsset } from '../../../../server/src/content-types/mux-asset/types';
import { useSignedTokens } from '../signed-tokens-provider';
import pluginPkg from '../../../../package.json';
import { PLUGIN_ID } from '../../pluginId';

const MuxPlayerStyled = styled(MuxPlayer)`
  width: 100%;
`;

const PreviewPlayer = (props: { muxAsset?: MuxAsset }) => {
  const { muxAsset } = props;

  const [videoToken, setVideoToken] = React.useState<string | null>();
  const [posterUrl, setPosterUrl] = React.useState<string>(
    // Empty pixel
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  );
  const [storyboardUrl, setStoryboardUrl] = React.useState<string>();
  const [animatedUrl, setAnimatedUrl] = React.useState<string>();
  const { video, thumbnail, storyboard, animated } = useSignedTokens();

  const init = async (muxAsset: MuxAsset) => {
    const { playback_id } = muxAsset;
    if (muxAsset.playback_id !== null && muxAsset.signed) {
      const videoToken = await video(muxAsset);
      const thumbnailToken = await thumbnail(muxAsset);
      const storyboardToken = await storyboard(muxAsset);
      const animatedToken = await animated(muxAsset);
      setVideoToken(videoToken);
      setPosterUrl(`/${PLUGIN_ID}/thumbnail/${playback_id}?token=${thumbnailToken}`);
      setStoryboardUrl(`/${PLUGIN_ID}/storyboard/${playback_id}?token=${storyboardToken}`);
      setAnimatedUrl(`/${PLUGIN_ID}/animated/${playback_id}?token=${animatedToken}`);
    } else if (muxAsset.playback_id !== null) {
      setPosterUrl(`/${PLUGIN_ID}/thumbnail/${playback_id}`);
    }
  };

  React.useEffect(() => {
    muxAsset && init(muxAsset);
  }, []);

  if (!muxAsset?.playback_id || (muxAsset.signed && !videoToken)) return null;

  return (
    <MuxPlayerStyled
      playbackId={muxAsset.playback_id}
      poster={posterUrl}
      playback-token={videoToken}
      // Disabled because even though we proxy this request, the images in the VTT still go against
      // image.mux.com which is causing CSP errors :'(
      // storyboard-src={storyboardUrl}
      metadata={{
        video_id: muxAsset.id,
        video_title: muxAsset.title,
        player_name: 'Strapi Admin Dashboard',
        player_version: pluginPkg.version,
        page_type: 'Preview Player',
      }}
      streamType="on-demand"
      style={{ display: 'block' }}
    />
  );
};

export default PreviewPlayer;
