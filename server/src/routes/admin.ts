const routes = [
  {
    method: 'POST',
    path: '/mux-video-uploader/direct-upload',
    handler: 'mux.postDirectUpload',
    config: {
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/mux-video-uploader/remote-upload',
    handler: 'mux.postRemoteUpload',
    config: {
      policies: [],
    },
  },
  {
    method: 'DELETE',
    path: '/mux-video-uploader/mux-asset/:documentId',
    handler: 'mux.deleteMuxAsset',
    config: {
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/mux-video-uploader/webhook-handler',
    handler: 'mux.muxWebhookHandler',
    config: {
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/thumbnail/:documentId',
    handler: 'mux.thumbnail',
    config: {
      auth: false,
      description: 'Proxies thumbnail requests to load correctly within the Strapi Admin Dashboard',
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/storyboard/:documentId',
    handler: 'mux.storyboard',
    config: {
      auth: false,
      description: 'Proxies storyboard requests to load correctly within the Strapi Admin Dashboard',
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/animated/:documentId',
    handler: 'mux.animated',
    config: {
      auth: false,
      description: 'Proxies animated requests to load correctly within the Strapi Admin Dashboard',
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/sign/:documentId',
    handler: 'mux.signMuxPlaybackId',
    config: {},
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/mux-text-tracks/:documentId',
    handler: 'mux.textTrack',
    config: {
      policies: [],
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/mux-asset',
    handler: 'mux-asset.find',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/mux-asset/count',
    handler: 'mux-asset.count',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/mux-asset/:documentId',
    handler: 'mux-asset.findOne',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/mux-asset/asset/:assetId',
    handler: 'mux-asset.getByAssetId',
    config: {
      policies: [],
      description: 'Get mux assets by asset ID',
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/mux-asset/playback/:playbackId',
    handler: 'mux-asset.getByPlaybackId',
    config: {
      policies: [],
      description: 'Get mux asset by playback ID',
    },
  },
  {
    method: 'POST',
    path: '/mux-video-uploader/mux-asset',
    handler: 'mux-asset.create',
    config: {
      policies: [],
    },
  },
  {
    method: 'PUT',
    path: '/mux-video-uploader/mux-asset/:documentId',
    handler: 'mux-asset.update',
    config: {
      policies: [],
    },
  },
  {
    method: 'DELETE',
    path: '/mux-video-uploader/mux-asset/:documentId',
    handler: 'mux-asset.del',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/mux-settings',
    handler: 'mux-settings.isConfigured',
    config: {
      policies: [],
    },
  },
];

export default routes;
