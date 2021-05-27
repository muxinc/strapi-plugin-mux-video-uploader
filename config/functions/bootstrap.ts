import pluginPkg from '../../package.json';

export = async () => {
  const actions = [
    {
      section: "settings",
      category: "Mux Video Uploader",
      displayName: "Access the Mux Video Uploader Settings page",
      uid: "settings.write",
      pluginName: pluginPkg.name,
    },
    {
      section: 'plugins',
      displayName: 'Read',
      uid: 'read',
      pluginName: pluginPkg.name,
    },
  ];

  await strapi.admin.services.permission.actionProvider.registerMany(actions);
};
