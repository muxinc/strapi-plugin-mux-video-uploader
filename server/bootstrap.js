const pluginId = require('./../admin/src/pluginId');

module.exports = async ({ strapi }) => {
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
      displayName: "Update",
      subCategory: "settings",
      uid: "settings.update",
      pluginName: pluginId
    },
  ];

  await strapi.admin.services.permission.actionProvider.registerMany(actions);
};
