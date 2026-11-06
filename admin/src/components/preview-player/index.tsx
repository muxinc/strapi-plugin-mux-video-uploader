import React from 'react';
import '@videojs/react/video/skin.css';
import { VideoPlayer, VideoSkin } from '@videojs/react/video';
import { MuxVideo } from '@videojs/react/media/mux-video';
import { MuxData } from '@videojs/react/extensions/mux-data';

import { MuxAsset } from '../../../../server/src/content-types/mux-asset/types';
import { useSignedTokens } from '../signed-tokens-provider';
import pluginPkg from '../../../../package.json';
import { PLUGIN_ID } from '../../pluginId';

type SignedTokens = { playback: string; thumbnail: string | null; storyboard: string | null };

const PreviewPlayer = (props: { muxAsset?: MuxAsset }) => {
  const { muxAsset } = props;

  const [tokens, setTokens] = React.useState<SignedTokens | null>(null);

  const { video, thumbnail, storyboard } = useSignedTokens();

  const init = async (muxAsset: MuxAsset) => {
    const playback = await video(muxAsset);
    const thumbnailToken = await thumbnail(muxAsset);
    const storyboardToken = await storyboard(muxAsset);
    if (playback) setTokens({ playback, thumbnail: thumbnailToken, storyboard: storyboardToken });
  };

  React.useEffect(() => {
    if (muxAsset?.playback_id && muxAsset.signed) init(muxAsset);
  }, []);

  if (!muxAsset?.playback_id || (muxAsset.signed && !tokens)) return null;

  // Known from the first render, so MuxVideo never shows the image.mux.com poster it would derive,
  // which Strapi's default CSP blocks. A signed video without a thumbnail token gets no poster.
  const thumbnailUrl = `/${PLUGIN_ID}/thumbnail/${muxAsset.playback_id}`;
  const posterUrl = !muxAsset.signed
    ? thumbnailUrl
    : tokens?.thumbnail
      ? `${thumbnailUrl}?token=${tokens.thumbnail}`
      : undefined;

  const aspectRatio = muxAsset.aspect_ratio || muxAsset.asset_data?.aspect_ratio;

  return (
    // The poster goes through the plugin's thumbnail proxy, so it stays within Strapi's default CSP
    // (img-src 'self'). Set on the player, it wins over the image.mux.com poster MuxVideo would derive.
    // `title=""` keeps the skin from overlaying the title: the modal already shows it next to the player.
    <VideoPlayer poster={posterUrl} title="">
      <VideoSkin
        style={{
          display: 'block',
          width: '100%',
          aspectRatio: aspectRatio ? aspectRatio.replace(':', ' / ') : '16 / 9',
        }}
      >
        <MuxVideo
          source={{
            playbackId: muxAsset.playback_id,
            // Force the MSE (hls.js) engine instead of native HLS playback.
            // With native playback the remote .m3u8 becomes the <video> src, which the
            // Strapi admin's default CSP blocks (media-src is 'self' data: blob' only).
            // Via MSE the src is a blob: URL, already allowed, and hls.js fetches the
            // manifest and segments over XHR, which falls under connect-src ('self' https:).
            // This keeps the player working without asking users to widen their CSP.
            preferPlayback: 'mse',
            ...(tokens && {
              playback: { token: tokens.playback },
              // The storyboard VTT and its images live on image.mux.com, which Strapi's default CSP
              // blocks; the README explains how to allow it to get timeline thumbnails.
              ...(tokens.storyboard && { storyboard: { token: tokens.storyboard } }),
            }),
          }}
          playsInline
          crossOrigin="anonymous"
        />
        <MuxData
          metadata={{
            video_id: String(muxAsset.id),
            video_title: muxAsset.title,
            player_name: 'Strapi Admin Dashboard',
            player_version: pluginPkg.version,
            page_type: 'Preview Player',
          }}
        />
      </VideoSkin>
    </VideoPlayer>
  );
};

export default PreviewPlayer;
