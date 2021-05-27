import pluginId from './../../admin/src/pluginId';

export = async () => {
  const actions = [
    {
      section: "settings",
      category: "Mux Video Uploader",
      displayName: "Access the Mux Video Uploader Settings page",
      uid: "settings.write",
      pluginName: pluginId
    },
    {
      section: 'plugins',
      displayName: 'Read',
      uid: 'read',
      pluginName: pluginId
    },
  ];

  await strapi.admin.services.permission.actionProvider.registerMany(actions);
};
