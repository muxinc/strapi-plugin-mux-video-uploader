const routes = [
  {
    method: 'POST',
    path: '/direct-upload',
    handler: 'mux.postDirectUpload',
    config: {
      policies: [],
      auth: false,
    },
  },
  {
    method: 'POST',
    path: '/remote-upload',
    handler: 'mux.postRemoteUpload',
    config: {
      policies: [],
      auth: false,
    },
  },
  {
    method: 'DELETE',
    path: '/mux-asset/:documentId',
    handler: 'mux.deleteMuxAsset',
    config: {
      policies: [],
      auth: false,
    },
  },
  {
    method: 'POST',
    path: '/webhook-handler',
    handler: 'mux.muxWebhookHandler',
    config: {
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/thumbnail/:documentId',
    handler: 'mux.thumbnail',
    config: {
      auth: false,
      description: 'Proxies thumbnail requests to load correctly within the Strapi Admin Dashboard',
    },
  },
  {
    method: 'GET',
    path: '/storyboard/:documentId',
    handler: 'mux.storyboard',
    config: {
      auth: false,
      description: 'Proxies storyboard requests to load correctly within the Strapi Admin Dashboard',
    },
  },
  {
    method: 'GET',
    path: '/animated/:documentId',
    handler: 'mux.animated',
    config: {
      auth: false,
      description: 'Proxies animated requests to load correctly within the Strapi Admin Dashboard',
    },
  },
  {
    method: 'GET',
    path: '/sign/:documentId',
    handler: 'mux.signMuxPlaybackId',
    config: {},
  },
  {
    method: 'GET',
    path: '/mux-text-tracks/:documentId',
    handler: 'mux.textTrack',
    config: {
      policies: [],
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/mux-asset',
    handler: 'mux-asset.find',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/mux-asset/count',
    handler: 'mux-asset.count',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/mux-asset/:documentId',
    handler: 'mux-asset.findOne',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/mux-asset/asset/:assetId',
    handler: 'mux-asset.getByAssetId',
    config: {
      policies: [],
      description: 'Get mux assets by asset ID',
    },
  },
  {
    method: 'GET',
    path: '/mux-asset/playback/:playbackId',
    handler: 'mux-asset.getByPlaybackId',
    config: {
      policies: [],
      description: 'Get mux asset by playback ID',
    },
  },
  {
    method: 'POST',
    path: '/mux-asset',
    handler: 'mux-asset.create',
    config: {
      policies: [],
    },
  },
  {
    method: 'PUT',
    path: '/mux-asset/:documentId',
    handler: 'mux-asset.update',
    config: {
      policies: [],
    },
  },
  {
    method: 'DELETE',
    path: '/mux-asset/:documentId',
    handler: 'mux-asset.del',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/mux-settings',
    handler: 'mux-settings.isConfigured',
    config: {
      policies: [],
    },
  },
];

export default routes;
