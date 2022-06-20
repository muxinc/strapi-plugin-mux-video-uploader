const routes = [
  {
    "method": "POST",
    "path": "/mux-video-uploader/submitDirectUpload",
    "handler": "mux.submitDirectUpload",
    "config": {
      "policies": [],
      "prefix": false
    }
  },
  {
    "method": "POST",
    "path": "/mux-video-uploader/submitRemoteUpload",
    "handler": "mux.submitRemoteUpload",
    "config": {
      "policies": [],
      "prefix": false
    }
  },
  {
    "method": "POST",
    "path": "/mux-video-uploader/deleteMuxAsset",
    "handler": "mux.deleteMuxAsset",
    "config": {
      "policies": [],
      "prefix": false
    }
  },
  {
    "method": "POST",
    "path": "/mux-video-uploader/webhook-handler",
    "handler": "mux.muxWebhookHandler",
    "config": {
      "auth": false,
      "prefix": false
    }
  },
  {
    "method": "GET",
    "path": "/mux-video-uploader/thumbnail/:playbackId",
    "handler": "mux.thumbnail",
    "config": {
      "auth": false,
      "prefix": false
    }
  },
  {
    "method": "GET",
    "path": "/mux-video-uploader/mux-asset",
    "handler": "mux-asset.find",
    "config": {
      "policies": [],
      "prefix": false
    }
  },
  {
    "method": "GET",
    "path": "/mux-video-uploader/mux-asset/count",
    "handler": "mux-asset.count",
    "config": {
      "policies": [],
      "prefix": false
    }
  },
  {
    "method": "GET",
    "path": "/mux-video-uploader/mux-asset/:id",
    "handler": "mux-asset.findOne",
    "config": {
      "policies": [],
      "prefix": false
    }
  },
  {
    "method": "POST",
    "path": "/mux-video-uploader/mux-asset",
    "handler": "mux-asset.create",
    "config": {
      "policies": [],
      "prefix": false
    }
  },
  {
    "method": "PUT",
    "path": "/mux-video-uploader/mux-asset/:id",
    "handler": "mux-asset.update",
    "config": {
      "policies": [],
      "prefix": false
    }
  },
  {
    "method": "DELETE",
    "path": "/mux-video-uploader/mux-asset/:id",
    "handler": "mux-asset.del",
    "config": {
      "policies": [],
      "prefix": false
    }
  },
    
  {
    "method": "GET",
    "path": "/mux-video-uploader/mux-settings",
    "handler": "mux-settings.isConfiged",
    "config": {
      "policies": [],
      "prefix": false
    }
  },
  {
    "method": "POST",
    "path": "/mux-video-uploader/mux-settings",
    "handler": "mux-settings.saveConfig",
    "config": {
      "policies": [],
      "prefix": false
    }
  },
  {
    "method": "DELETE",
    "path": "/mux-video-uploader/mux-settings",
    "handler": "mux-settings.clearConfig",
    "config": {
      "policies": [],
      "prefix": false
    }
  }
];

export default routes;
