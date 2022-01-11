import pluginId from './../admin/src/pluginId';

export = async ({ strapi }: { strapi: any }) => {
  console.log('bootstrapping');
  const actions = [
    // App
    {
      section: 'plugins',
      displayName: 'Read',
      uid: 'read',
      pluginName: pluginId
    },
    // Settings
    {
      section: "plugins",
      displayName: "Read",
      subCategory: "settings",
      uid: "settings.read",
      pluginName: pluginId
    },
    {
      section: "plugins",
      displayName: "Write",
      subCategory: "settings",
      uid: "settings.write",
      pluginName: pluginId
    },
  ];

  await strapi.admin.services.permission.actionProvider.registerMany(actions);
};
