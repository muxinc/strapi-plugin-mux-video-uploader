import React from 'react';
import { MuxAsset } from '../../../server/src/content-types/mux-asset/types';
type SignFunction = (muxAsset: MuxAsset) => Promise<string | null>;
export declare const SignedTokensContext: React.Context<{
    video: SignFunction;
    thumbnail: SignFunction;
    storyboard: SignFunction;
}>;
export declare function useSignedTokens(): {
    video: SignFunction;
    thumbnail: SignFunction;
    storyboard: SignFunction;
};
export default function SignedTokensProvider({ muxAsset, children }: React.PropsWithChildren<{
    muxAsset?: MuxAsset;
}>): import("react/jsx-runtime").JSX.Element;
export {};
