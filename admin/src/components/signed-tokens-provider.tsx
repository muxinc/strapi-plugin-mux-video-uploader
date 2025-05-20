import React from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

import { MuxAsset } from '../../../server/src/content-types/mux-asset/types';
import { PLUGIN_ID } from '../pluginId';

type SignFunction = (muxAsset: MuxAsset) => Promise<string | null>;

export const SignedTokensContext = React.createContext<{
  video: SignFunction;
  thumbnail: SignFunction;
  storyboard: SignFunction;
  animated: SignFunction;
}>({
  video: async () => null,
  thumbnail: async () => null,
  storyboard: async () => null,
  animated: async () => null,
});

export function useSignedTokens() {
  return React.useContext(SignedTokensContext);
}

export default function SignedTokensProvider({ muxAsset, children }: React.PropsWithChildren<{ muxAsset?: MuxAsset }>) {
  const { get } = useFetchClient();

  const video: SignFunction = async function (muxAsset) {
    const { data } = await get(`${PLUGIN_ID}/sign/${muxAsset.playback_id}?type=video`);

    return data.token;
  };

  const thumbnail: SignFunction = async function (muxAsset) {
    const { data } = await get(`${PLUGIN_ID}/sign/${muxAsset.playback_id}?type=thumbnail`);

    return data.token;
  };

  const storyboard: SignFunction = async function (muxAsset) {
    const { data } = await get(`${PLUGIN_ID}/sign/${muxAsset.playback_id}?type=storyboard`);

    return data.token;
  };

  const animated: SignFunction = async function (muxAsset) {
    const { data } = await get(`${PLUGIN_ID}/sign/${muxAsset.playback_id}?type=animated`);

    return data.token;
  };

  return (
    <SignedTokensContext.Provider
      value={{
        video,
        thumbnail,
        storyboard,
        animated,
      }}
    >
      {children}
    </SignedTokensContext.Provider>
  );
}
