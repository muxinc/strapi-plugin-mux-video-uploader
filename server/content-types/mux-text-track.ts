export = {
  kind: 'collectionType',
  collectionName: 'muxtexttracks',
  info: {
    name: 'mux-text-track',
    description: 'Temporary storage for user-defined subtitles & captions sent to Mux during video uploads',
    displayName: 'Mux Text Track',
    singularName: 'mux-text-track',
    pluralName: 'mux-text-tracks',
  },
  pluginOptions: {
    'content-manager': {
      visible: false,
    },
    'content-type-builder': {
      visible: false,
    },
  },
  options: {
    increments: true,
    timestamps: true,
  },
  attributes: {
    name: {
      type: 'string',
      private: false,
      required: true,
    },
    language_code: {
      type: 'string',
      private: false,
      required: true,
    },
    closed_captions: {
      type: 'boolean',
      private: false,
      required: true,
    },
    file: {
      type: 'json',
      private: false,
      required: true,
    },
  },
};
