import React from 'react';
import videojs from '@mux/videojs-kit';

import { MuxAsset } from '../../../../types';
import { getThumbnail } from '../../services/strapi';

import '@mux/videojs-kit/dist/index.css';  

interface Props {
  muxAsset?: MuxAsset;
}

const PreviewPlayer = (props:Props) => {
  const { muxAsset } = props;

  const playerRef = React.useRef<any|undefined>();

  const handleOnPlayerReady = () => playerRef.current?.src({ type: 'video/mux', src: muxAsset?.playback_id });

  React.useEffect(() => {
    playerRef.current = videojs('mux-default', {
      "timelineHoverPreviews": true,
      "plugins": {
        "mux": {
          "data": {}
        }
      }
    });

    playerRef.current?.ready(handleOnPlayerReady);

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
