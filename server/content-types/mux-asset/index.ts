export = {
  "kind": "collectionType",
  "collectionName": "muxassets",
  "info": {
    "name": "mux-asset",
    "description": "Represents a Mux Asset item, including upload and playback details",
    "displayName": "Mux Asset",
    "singularName": "mux-asset",
    "pluralName": "mux-assets"
  },
  "pluginOptions": {
    "content-manager": {
      "visible": true,
    },
    "content-type-builder": {
      "visible": true,
    },
  },
  "options": {
    "increments": true,
    "timestamps": true
  },
  "attributes": {
    "title": {
      "type": "string",
      "private": false,
      "required": true,
      "maxLength": 255,
      "minLength": 3
    },
    "upload_id": {
      "type": "string",
      "required": false,
      "maxLength": 255
    },
    "asset_id": {
      "type": "string",
      "required": false,
      "maxLength": 255
    },
    "playback_id": {
      "type": "string",
      "required": false,
      "maxLength": 255
    },
    "error_message": {
      "type": "string",
      "required": false,
      "maxLength": 255
    },
    "isReady": {
      "type": "boolean",
      "default": false,
      "required": false
    },
    "duration": {
      "type": "decimal",
      "required": false
    },
    "aspect_ratio": {
      "type": "string",
      "required": false
    }
  }
};
