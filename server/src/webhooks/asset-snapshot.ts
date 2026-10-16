import type Mux from '@mux/ts';

/** The mux-asset columns that mirror the Mux asset. Safe for assets without playback IDs or a duration. */
export const snapshotFromAsset = (asset: Mux.Video.Assets.Asset) => ({
  playback_id: asset.playback_ids?.[0]?.id ?? null,
  duration: asset.duration ?? null,
  aspect_ratio: asset.aspect_ratio ?? null,
  isReady: asset.status === 'ready',
  asset_data: asset,
});
