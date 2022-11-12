import pluginId from './../admin/src/pluginId';
import { sync } from './utils/sync';

export = async ({ strapi }: { strapi: any }) => {
  // @ts-ignore - No types for global strapi variable
  if(Object.keys(strapi.plugins).indexOf('users-permissions') === -1) {
    throw new Error("The users-permissions plugin is required in order to use the Mux Video Uploader");
  }

  const actions = [
    // App
    {
      section: 'plugins',
      displayName: 'Read',
      uid: 'read',
      pluginName: pluginId
    },
    {
      section: 'plugins',
      displayName: 'Create',
      uid: 'create',
      pluginName: pluginId
    },
    {
      section: 'plugins',
      displayName: 'Update',
      uid: 'update',
      pluginName: pluginId
    },
    {
      section: 'plugins',
      displayName: 'Delete',
      uid: 'delete',
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

  sync();

  await strapi.admin.services.permission.actionProvider.registerMany(actions);
};
