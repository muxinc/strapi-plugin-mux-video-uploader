import { getService } from '.';
import { MuxAsset } from '../../types';
import pluginId from './../../admin/src/pluginId';
import { forEachRateLimit } from './rate-limit';

const model = `plugin::${pluginId}.mux-asset`;
const ASSET_NO_LONGER_EXISTS = 'Asset does not exist on Mux';

const sync = async () => {
  const filters = {
    $or: [
      {
        error_message: { $ne: ASSET_NO_LONGER_EXISTS }
      },
      {
        $or: [
          { asset_id: { $null: true } },
          { playback_id: { $null: true } },
          { duration: { $null: true } },
          { aspect_ratio: { $null: true } },
          { is_ready: false }
        ]
      }
    ]
  };

  const assets = await strapi.entityService.findMany(
    model,
    {
      filters,
      limit: -1
    }
  );

  if (assets.length === 0) return;

  strapi.log.info(`[mux-video-uploader] Found ${assets.length} to be sync'd`);

  const predicate = async (a:MuxAsset) => {
    let asset;
    try {
      if (a.asset_id) {
        asset = await getService('mux').getAssetById(a.asset_id);
      } else if (a.upload_id) {
        asset = await getService('mux').getAssetByUploadId(a.upload_id);
      } else {
        strapi.log.warn('Unresolvable asset for sync:', JSON.stringify(a));
        return;
      }
    } catch (err:any) {
      if (err && err.type === 'not_found') {
        asset = undefined;
      } else {
        strapi.log.error('Error when attempting to get asset:', err);
      }
    }

    const params:any = {
      data: {}
    };

    if (asset) {
      const playback_id = asset?.playback_ids?.find(playback_id => playback_id.policy === 'public')?.id;
      const duration = typeof (asset.duration) === 'number' ? asset.duration : null;
      
      params.data.asset_id = asset.id;
      params.data.aspect_ratio = asset.aspect_ratio;
      params.data.playback_id = playback_id;
      params.data.duration = duration;
      params.data.isReady = true;
    }
    else {
      params.data.error_message = ASSET_NO_LONGER_EXISTS;
      params.data.isReady = false;
    }
    
    await strapi.entityService.update(model, a.id, params);

    strapi.log.info(`[mux-video-uploader] Updated mux-asset with id: ${a.id}`);
  };

  // Respect Mux's 5 requests per second API limit for reading
  forEachRateLimit<MuxAsset>(assets, predicate, { count: 5 });
};

export { sync };
