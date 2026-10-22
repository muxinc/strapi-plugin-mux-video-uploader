import { beforeEach, describe, expect, it } from 'vitest';

import { FakeStrapi, installFakeStrapi } from '../../../test/strapi';
import { findMuxAssets, resolveMuxAssetOrNull, updateMuxAssets } from './resolve-mux-asset';
import { ASSET_MODEL } from './types';

let fake: FakeStrapi;

beforeEach(() => {
  fake = installFakeStrapi();
  // Stored out of id order, as a database without an ORDER BY may return them.
  fake.db.seed(ASSET_MODEL, [
    { id: 9, title: 'Newer', asset_id: 'ast_1' },
    { id: 3, title: 'Older', asset_id: 'ast_1' },
    { id: 5, title: 'Elsewhere', asset_id: 'ast_2' },
  ]);
});

describe('resolving a Mux asset to its rows', () => {
  it('resolves to the oldest row on the asset, whatever order the database returns', async () => {
    expect((await resolveMuxAssetOrNull({ asset_id: 'ast_1' }))?.id).toBe(3);
    expect(fake.db.query(ASSET_MODEL).findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { id: 'asc' } })
    );
  });

  it('finds every row on the asset, oldest first', async () => {
    expect((await findMuxAssets({ asset_id: 'ast_1' })).map((row) => row.id)).toEqual([3, 9]);
  });

  it('writes onto every row on the asset, and only those', async () => {
    const updated = await updateMuxAssets({ asset_id: 'ast_1' }, { isReady: true });

    expect(updated.map((row) => row.id)).toEqual([3, 9]);
    expect(fake.db.rows(ASSET_MODEL).map((row) => [row.id, row.isReady ?? false])).toEqual([
      [9, true],
      [3, true],
      [5, false],
    ]);
  });

  it('matches nothing without an id', async () => {
    expect(await findMuxAssets({ asset_id: '' })).toEqual([]);
    expect(await updateMuxAssets({ asset_id: undefined }, { isReady: true })).toEqual([]);
    expect(fake.db.query(ASSET_MODEL).update).not.toHaveBeenCalled();
  });
});
