const tails = new Map<string, Promise<unknown>>();

/**
 * Runs `task` after every earlier task for the same asset has settled.
 *
 * Robots writes for one asset are read-modify-write (claiming a placeholder, upserting by Mux id,
 * merging `robots_outputs`), and webhooks for the same job can arrive together. Never hold it across
 * a Mux call: webhooks waiting on it must still answer within Mux's 5 seconds.
 */
export function withAssetLock<T>(assetId: string | null | undefined, task: () => Promise<T>): Promise<T> {
  const key = assetId || '';
  const previous = tails.get(key) ?? Promise.resolve();
  const run = previous.then(task, task);
  const tail = run.catch(() => undefined);

  tails.set(key, tail);
  tail.then(() => {
    if (tails.get(key) === tail) tails.delete(key);
  });

  return run;
}
