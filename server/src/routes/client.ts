const routes = [
  {
    method: 'POST',
    path: '/mux-video-uploader/direct-upload',
    handler: 'mux.postDirectUpload',
    config: {
      policies: [],
      prefix: false,
    },
  },
  {
    method: 'POST',
    path: '/mux-video-uploader/remote-upload',
    handler: 'mux.postRemoteUpload',
    config: {
      policies: [],
      prefix: false,
    },
  },
  {
    method: 'DELETE',
    path: '/mux-video-uploader/mux-asset/:documentId',
    handler: 'mux.deleteMuxAsset',
    config: {
      policies: [],
      prefix: false,
    },
  },
  {
    method: 'POST',
    path: '/mux-video-uploader/webhook-handler',
    handler: 'mux.muxWebhookHandler',
    config: {
      auth: false,
      prefix: false,
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/thumbnail/:documentId',
    handler: 'mux.thumbnail',
    config: {
      auth: false,
      prefix: false,
      description: 'Proxies thumbnail requests to load correctly within the Strapi Admin Dashboard',
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/storyboard/:documentId',
    handler: 'mux.storyboard',
    config: {
      auth: false,
      prefix: false,
      description: 'Proxies storyboard requests to load correctly within the Strapi Admin Dashboard',
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/sign/:documentId',
    handler: 'mux.signMuxPlaybackId',
    config: {
      prefix: false,
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/mux-text-tracks/:documentId',
    handler: 'mux.textTrack',
    config: {
      policies: [],
      prefix: false,
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/mux-asset',
    handler: 'mux-asset.find',
    config: {
      policies: [],
      prefix: false,
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/mux-asset/count',
    handler: 'mux-asset.count',
    config: {
      policies: [],
      prefix: false,
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/mux-asset/:documentId',
    handler: 'mux-asset.findOne',
    config: {
      policies: [],
      prefix: false,
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/mux-asset/asset/:assetId',
    handler: 'mux-asset.getByAssetId',
    config: {
      policies: [],
      prefix: false,
      description: 'Get mux assets by asset ID',
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/mux-asset/playback/:playbackId',
    handler: 'mux-asset.getByPlaybackId',
    config: {
      policies: [],
      prefix: false,
      description: 'Get mux asset by playback ID',
    },
  },
  {
    method: 'POST',
    path: '/mux-video-uploader/mux-asset',
    handler: 'mux-asset.create',
    config: {
      policies: [],
      prefix: false,
    },
  },
  {
    method: 'PUT',
    path: '/mux-video-uploader/mux-asset/:documentId',
    handler: 'mux-asset.update',
    config: {
      policies: [],
      prefix: false,
    },
  },
  {
    method: 'DELETE',
    path: '/mux-video-uploader/mux-asset/:documentId',
    handler: 'mux-asset.del',
    config: {
      policies: [],
      prefix: false,
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/mux-settings',
    handler: 'mux-settings.isConfigured',
    config: {
      policies: [],
      prefix: false,
    },
  },
];

export default routes;
