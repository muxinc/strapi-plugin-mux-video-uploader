import { getService } from '../utils';
import { resolveMuxAssetOrNull, updateMuxAssets } from '../utils/resolve-mux-asset';
import { snapshotFromAsset } from './asset-snapshot';

/**
 * Re-reads assets from Mux once a webhook has been answered, since Mux gives up on a webhook after
 * 5 s. The details modal lists captions from the stored `asset_data`, so without a refresh a caption
 * Robots adds never shows.
 *
 * Per asset: at most one refresh in flight, plus one queued for anything that arrives meanwhile, so
 * the last state always lands. Failures are logged and dropped; the next event repairs the snapshot.
 */

interface RefreshState {
  queued: boolean;
  done: Promise<void>;
}

const refreshes = new Map<string, RefreshState>();

const MAX_PARALLEL_REFRESHES = 4;
let activeRefreshes = 0;
const waitingForSlot: Array<() => void> = [];

async function withRefreshSlot(task: () => Promise<void>) {
  if (activeRefreshes < MAX_PARALLEL_REFRESHES) activeRefreshes += 1;
  else await new Promise<void>((resolve) => waitingForSlot.push(resolve));

  try {
    await task();
  } finally {
    // Hand the slot straight to the next waiting refresh, or free it.
    const next = waitingForSlot.shift();
    if (next) next();
    else activeRefreshes -= 1;
  }
}

export function scheduleAssetRefresh(assetId: string) {
  const running = refreshes.get(assetId);
  if (running) {
    running.queued = true;
    return;
  }

  const state = { queued: false } as RefreshState;
  refreshes.set(assetId, state);

  state.done = new Promise<void>((resolve) => {
    setImmediate(async () => {
      try {
        do {
          await withRefreshSlot(async () => {
            state.queued = false;
            await refreshAsset(assetId);
          });
        } while (state.queued);
      } finally {
        refreshes.delete(assetId);
        resolve();
      }
    });
  });
}

/**
 * Called after a webhook writes to an asset directly: a refresh already reading that asset may have
 * read it before the change, so it reads once more when it's done.
 */
export function rereadIfRefreshing(assetId: string) {
  const running = refreshes.get(assetId);
  if (running) running.queued = true;
}

/** Never throws: nothing awaits it once the webhook has been answered. */
async function refreshAsset(assetId: string) {
  try {
    if (!(await resolveMuxAssetOrNull({ asset_id: assetId }))) return;

    const asset = await getService('mux').getAssetById(assetId);

    await updateMuxAssets({ asset_id: assetId }, snapshotFromAsset(asset));
  } catch (error) {
    strapi.log.warn(
      `[mux-video-uploader] Could not refresh Mux asset ${assetId}: ${error instanceof Error ? error.message : error}`
    );
  }
}

export async function refreshesSettled() {
  while (refreshes.size > 0) {
    await Promise.all(Array.from(refreshes.values(), (state) => state.done));
  }
}
