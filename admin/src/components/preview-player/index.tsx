import React from 'react';
import videojs from '@mux/videojs-kit';

import { MuxAsset } from '../../../../types';
import { getPlaybackToken, getThumbnail } from '../../services/strapi';

import '@mux/videojs-kit/dist/index.css';  

interface Props {
  muxAsset?: MuxAsset;
}

const PreviewPlayer = (props:Props) => {
  const { muxAsset } = props;

  const playerRef = React.useRef<any|undefined>();

  const handleOnPlayerReady = (src?: string | null) => playerRef.current?.src({ type: 'video/mux', src });

  React.useEffect(() => {
    const generateSignedSrc = async (playbackId: string) => {
      const token = await getPlaybackToken(playbackId, 'video');
      
      return `${playbackId}?token=${token}`;
    }

    const initPlayer = async () => {
      const src = muxAsset && muxAsset.playback_id ?
        await generateSignedSrc(muxAsset.playback_id) :
        muxAsset?.playback_id;

      playerRef.current = videojs('mux-default', {
        "timelineHoverPreviews": false,
        "plugins": {
          "mux": {
            "data": {}
          }
        }
      });

      playerRef.current?.ready(() => handleOnPlayerReady(src));
    }

    initPlayer();

    return () => playerRef.current?.dispose();
  }, []);

  if(muxAsset === undefined) return null;

  const posterUrl = getThumbnail(muxAsset.playback_id);
  
  return (
    <video
      id="mux-default"
      className="video-js vjs-16-9"
      controls
      preload="auto"
      width="100%"
      poster={posterUrl}
    />
  );
};

export default PreviewPlayer;
