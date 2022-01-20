const React = require('react');
const videojs = require('@mux/videojs-kit');

const { MuxAsset } = require('../../../../types');

require('@mux/videojs-kit/dist/index.css');

const PreviewPlayer = (props) => {
  const { muxAsset } = props;

  const playerRef = React.useRef();

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

  const posterUrl = `https://image.mux.com/${muxAsset.playback_id}/thumbnail.jpg`;
  
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
