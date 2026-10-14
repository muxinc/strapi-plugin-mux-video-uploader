import { can } from './policies';

const routes = [
  {
    method: 'POST',
    path: '/mux-video-uploader/direct-upload',
    handler: 'mux.postDirectUpload',
    config: {
      policies: [can('create')],
      prefix: false,
    },
  },
  {
    method: 'POST',
    path: '/mux-video-uploader/remote-upload',
    handler: 'mux.postRemoteUpload',
    config: {
      policies: [can('create')],
      prefix: false,
    },
  },
  {
    method: 'DELETE',
    path: '/mux-video-uploader/mux-asset/:documentId',
    handler: 'mux.deleteMuxAsset',
    config: {
      policies: [can('delete')],
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
      policies: [can('read')],
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
      policies: [can('read')],
      prefix: false,
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/mux-asset/count',
    handler: 'mux-asset.count',
    config: {
      policies: [can('read')],
      prefix: false,
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/mux-asset/:documentId',
    handler: 'mux-asset.findOne',
    config: {
      policies: [can('read')],
      prefix: false,
    },
  },
  {
    method: 'POST',
    path: '/mux-video-uploader/mux-asset',
    handler: 'mux-asset.create',
    config: {
      policies: [can('create')],
      prefix: false,
    },
  },
  {
    method: 'PUT',
    path: '/mux-video-uploader/mux-asset/:documentId',
    handler: 'mux-asset.update',
    config: {
      policies: [can('update')],
      prefix: false,
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/mux-settings',
    handler: 'mux-settings.isConfigured',
    config: {
      policies: [can('read')],
      prefix: false,
    },
  },
  {
    method: 'POST',
    path: '/mux-video-uploader/mux-asset/:asset/apply-title',
    handler: 'mux-asset.applyTitle',
    config: {
      policies: [can('update')],
      prefix: false,
    },
  },
  {
    method: 'POST',
    path: '/mux-video-uploader/mux-asset/:asset/playback-id',
    handler: 'mux-asset.createPlaybackId',
    config: {
      policies: [can('update')],
      prefix: false,
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/robots/assets/:asset/jobs',
    handler: 'robots.listJobs',
    config: {
      policies: [can('read')],
      prefix: false,
    },
  },
  {
    method: 'POST',
    path: '/mux-video-uploader/robots/assets/:asset/sync',
    handler: 'robots.sync',
    config: {
      policies: [can('read')],
      prefix: false,
    },
  },
  {
    method: 'POST',
    path: '/mux-video-uploader/robots/assets/:asset/jobs',
    handler: 'robots.createJob',
    config: {
      policies: [can('robots.run')],
      prefix: false,
    },
  },
  {
    method: 'POST',
    path: '/mux-video-uploader/robots/assets/:asset/directive-runs',
    handler: 'robots.runDirective',
    config: {
      policies: [can('robots.run')],
      prefix: false,
    },
  },
  {
    method: 'POST',
    path: '/mux-video-uploader/robots/jobs/:id/cancel',
    handler: 'robots.cancelJob',
    config: {
      policies: [can('robots.run')],
      prefix: false,
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/robots/jobs/:id',
    handler: 'robots.findJob',
    config: {
      policies: [can('read')],
      prefix: false,
    },
  },
  {
    method: 'DELETE',
    path: '/mux-video-uploader/robots/pending/:id',
    handler: 'robots.dismissPending',
    config: {
      policies: [can('robots.run')],
      prefix: false,
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/robots/directives',
    handler: 'robots.listDirectives',
    config: {
      policies: [can('read')],
      prefix: false,
    },
  },
  {
    method: 'GET',
    path: '/mux-video-uploader/robots/entry-videos',
    handler: 'robots.entryVideos',
    config: {
      // Whoever can read the entry in the Content Manager: the controller checks it per model.
      policies: [],
      prefix: false,
    },
  },
];

export default routes;
