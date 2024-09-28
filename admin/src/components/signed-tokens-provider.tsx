import React from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

import { MuxAsset } from '../../../server/src/content-types/mux-asset/types';
import { PLUGIN_ID } from '../pluginId';

export const SignedTokensContext = React.createContext<{
  video: string | null;
  thumbnail: string | null;
  storyboard: string | null;
}>({
  video: null,
  thumbnail: null,
  storyboard: null,
});

export function useSignedTokens() {
  return React.useContext(SignedTokensContext);
}

export default function SignedTokensProvider({ muxAsset, children }: React.PropsWithChildren<{ muxAsset?: MuxAsset }>) {
  const [playbackToken, setPlaybackToken] = React.useState<string>('');
  const [thumbnailToken, setThumbnailToken] = React.useState<string>('');
  const [storyboardToken, setStoryboardToken] = React.useState<string>('');

  const { get } = useFetchClient();

  const init = async (muxAsset:MuxAsset) => {
    const { data: videoData } = await get(`${PLUGIN_ID}/sign/${muxAsset.playback_id}?type=video`);
    const { data: thumbnailData } = await get(`${PLUGIN_ID}/sign/${muxAsset.playback_id}?type=thumbnail`);
    const { data: storyboardData } = await get(`${PLUGIN_ID}/sign/${muxAsset.playback_id}?type=storyboard`);

    setPlaybackToken(videoData.token);
    setThumbnailToken(thumbnailData.token);
    setStoryboardToken(storyboardData.token);
  };

  React.useEffect(() => {
    if (!muxAsset?.signed || !muxAsset?.playback_id) return;

    init(muxAsset);
  }, []);

  return (
    <SignedTokensContext.Provider
      value={{
        video: playbackToken,
        thumbnail: thumbnailToken,
        storyboard: storyboardToken,
      }}
    >
      {children}
    </SignedTokensContext.Provider>
  );
}
