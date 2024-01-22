import React, { PropsWithChildren } from 'react';
import { MuxAsset } from '../../../server/content-types/mux-asset/types';
import { getPlaybackToken } from '../services/strapi';

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

export default function SignedTokensProvider({ muxAsset, children }: PropsWithChildren<{ muxAsset?: MuxAsset }>) {
  const [playbackToken, setPlaybackToken] = React.useState<string>('');
  const [thumbnailToken, setThumbnailToken] = React.useState<string>('');
  const [storyboardToken, setStoryboardToken] = React.useState<string>('');

  React.useEffect(() => {
    if (!muxAsset?.signed || !muxAsset?.playback_id) return;

    getPlaybackToken(muxAsset.playback_id, 'video').then((data) => setPlaybackToken(data.token));
    getPlaybackToken(muxAsset.playback_id, 'thumbnail').then((data) => setThumbnailToken(data.token));
    getPlaybackToken(muxAsset.playback_id, 'storyboard').then((data) => setStoryboardToken(data.token));
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
