import type Mux from '@mux/ts';

/** `error_message` is a 255-character column; a longer write would fail and Mux would retry for 24 h. */
const ERROR_MESSAGE_MAX_LENGTH = 255;

/** How a Mux asset's `errors` read in `error_message`. */
export const assetErrorMessage = (errors?: Mux.Video.Assets.Asset['errors']) =>
  `${errors?.type ?? 'error'}: ${errors?.messages?.[0] || ''}`.slice(0, ERROR_MESSAGE_MAX_LENGTH);

/**
 * The mux-asset columns that mirror the Mux asset. Safe for assets without playback IDs or a duration.
 *
 * An errored asset also gets its `error_message`: `video.asset.errored` finds no row when it arrives
 * before `video.upload.asset_created`, and the read after that one is what records it.
 */
export const snapshotFromAsset = (asset: Mux.Video.Assets.Asset) => ({
  playback_id: asset.playback_ids?.[0]?.id ?? null,
  duration: asset.duration ?? null,
  aspect_ratio: asset.aspect_ratio ?? null,
  isReady: asset.status === 'ready',
  asset_data: asset,
  ...(asset.status === 'errored' ? { error_message: assetErrorMessage(asset.errors) } : {}),
});
