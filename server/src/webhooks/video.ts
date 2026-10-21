import { withAssetLock } from '../robots/lock';
import { backfillOutputs } from '../robots/outputs';
import { findMuxAssets, MuxAssetFilter, resolveMuxAssetOrNull } from '../utils/resolve-mux-asset';
import { ASSET_MODEL } from '../utils/types';
import { nonEmptyString } from '../utils/values';
import { assetErrorMessage, snapshotFromAsset } from './asset-snapshot';
import { rereadIfRefreshing, scheduleAssetRefresh } from './refresh-queue';
import type { WebhookEvent, WebhookOutcome } from './types';

const TRACK_EVENTS = [
  'video.asset.track.created',
  'video.asset.track.ready',
  'video.asset.track.errored',
  'video.asset.track.deleted',
];

export async function handleVideoEvent(event: WebhookEvent): Promise<WebhookOutcome> {
  const data = (event.data ?? {}) as Record<string, any>;

  switch (event.type) {
    // `video.asset.ready` or `video.asset.errored` may have arrived first and found no asset with this
    // id, so read the asset once the event is answered. Robots results that arrived before it are written now.
    case 'video.upload.asset_created': {
      const assetId = nonEmptyString(data.asset_id);
      if (!assetId) return 'ignored';

      const outcome = await updateMuxAsset({ upload_id: nonEmptyString(data.id) }, { asset_id: assetId });
      if (outcome === 'handled') {
        await withAssetLock(assetId, () => backfillOutputs(assetId));
        scheduleAssetRefresh(assetId);
      }

      return outcome;
    }

    case 'video.asset.ready':
      return updateMuxAsset({ asset_id: nonEmptyString(data.id) }, snapshotFromAsset(data as any));

    case 'video.upload.errored':
      return updateMuxAsset(
        { upload_id: nonEmptyString(data.id) },
        { error_message: 'There was an unexpected error during upload' }
      );

    case 'video.asset.errored':
      return updateMuxAsset({ asset_id: nonEmptyString(data.id) }, { error_message: assetErrorMessage(data.errors) });

    // The payload can be older than what Mux holds now, so read the asset again rather than trust it.
    case 'video.asset.updated':
      return refreshMuxAsset(data.id);

    default:
      if (TRACK_EVENTS.includes(event.type)) return refreshMuxAsset(data.asset_id);

      return 'ignored';
  }
}

/** Writes onto every row the filter matches. */
async function updateMuxAsset(filter: MuxAssetFilter, data: Record<string, unknown>): Promise<WebhookOutcome> {
  const muxAssets = await findMuxAssets(filter);
  if (muxAssets.length === 0) return 'ignored';

  for (const muxAsset of muxAssets) {
    await strapi.db.query(ASSET_MODEL).update({ where: { id: muxAsset.id }, data });

    // Otherwise a refresh that read Mux before this event could overwrite it with older data.
    if (muxAsset.asset_id) rereadIfRefreshing(muxAsset.asset_id);
  }

  return 'handled';
}

async function refreshMuxAsset(assetId: unknown): Promise<WebhookOutcome> {
  if (typeof assetId !== 'string' || !(await resolveMuxAssetOrNull({ asset_id: assetId }))) return 'ignored';

  scheduleAssetRefresh(assetId);

  return 'handled';
}
