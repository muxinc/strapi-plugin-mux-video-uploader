import React from 'react';
import styled from 'styled-components';
import '@videojs/react/video/skin.css';
import { VideoPlayer, VideoSkin } from '@videojs/react/video';
import { MuxVideo } from '@videojs/react/media/mux-video';
import { MuxData } from '@videojs/react/extensions/mux-data';

import { MuxAsset } from '../../../../server/src/content-types/mux-asset/types';
import { useSignedTokens } from '../signed-tokens-provider';
import pluginPkg from '../../../../package.json';
import { PLUGIN_ID } from '../../pluginId';

type SignedTokens = { playback: string; thumbnail: string | null; storyboard: string | null };

// Keeps the form below the player in view, and the control bar of a vertical video on screen.
const MAX_HEIGHT = '50vh';

// Strapi's global reset isn't in a cascade layer, so it beats every @layer rule of the skin:
// menu items lose their margins, the highlighted item its background and the error dialog its
// type. `revert-layer` hands those properties back to the skin. `&&` doubles the class so the
// first rule also beats Strapi's `*:focus-visible` outline.
const Skin = styled(VideoSkin)`
  && * {
    margin: revert-layer;
    outline: revert-layer;
    outline-offset: revert-layer;
  }

  && :is(button, input, p, h1, h2, h3, h4, h5, h6, ol, ul) {
    padding: revert-layer;
    border: revert-layer;
    background: revert-layer;
    font: revert-layer;
    list-style: revert-layer;
    overflow-wrap: revert-layer;
  }
`;

// "16:9" → [16, 9]. Anything else falls back to 16:9.
const parseAspectRatio = (value?: string | null): [number, number] => {
  const [width, height] = (value ?? '').split(':').map(Number);
  return width > 0 && height > 0 ? [width, height] : [16, 9];
};

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

  if (!muxAsset?.playback_id) return null;

  // Full width, unless that would make it taller than MAX_HEIGHT: then it narrows and stays centered.
  const [ratioWidth, ratioHeight] = parseAspectRatio(muxAsset.aspect_ratio || muxAsset.asset_data?.aspect_ratio);
  const sizeStyle: React.CSSProperties = {
    display: 'block',
    aspectRatio: `${ratioWidth} / ${ratioHeight}`,
    width: `min(100%, calc(${MAX_HEIGHT} * ${ratioWidth} / ${ratioHeight}))`,
    marginInline: 'auto',
  };

  // Holds the player's space while a signed video's tokens load.
  if (muxAsset.signed && !tokens) return <div style={sizeStyle} />;

  // Known from the first render, so MuxVideo never shows the image.mux.com poster it would derive,
  // which Strapi's default CSP blocks. A signed video without a thumbnail token gets no poster.
  const thumbnailUrl = `/${PLUGIN_ID}/thumbnail/${muxAsset.playback_id}`;
  const posterUrl = !muxAsset.signed
    ? thumbnailUrl
    : tokens?.thumbnail
      ? `${thumbnailUrl}?token=${tokens.thumbnail}`
      : undefined;

  return (
    // The poster goes through the plugin's thumbnail proxy, so it stays within Strapi's default CSP
    // (img-src 'self'). Set on the player, it wins over the image.mux.com poster MuxVideo would derive.
    // `title=""` keeps the skin from overlaying the title: the modal already shows it next to the player.
    <VideoPlayer poster={posterUrl} title="">
      <Skin style={sizeStyle}>
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
      </Skin>
    </VideoPlayer>
  );
};

export default PreviewPlayer;
