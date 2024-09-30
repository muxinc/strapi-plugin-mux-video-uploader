import type { Core } from '@strapi/strapi';

import { PLUGIN_NAME } from './constants/index';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  // @ts-ignore - No types for global strapi variable
  if (Object.keys(strapi.plugins).indexOf('users-permissions') === -1) {
    throw new Error('The users-permissions plugin is required in order to use the Mux Video Uploader');
  }

  const actions = [
    // App
    {
      section: 'plugins',
      displayName: 'Read',
      uid: 'read',
      pluginName: PLUGIN_NAME,
    },
    {
      section: 'plugins',
      displayName: 'Create',
      uid: 'create',
      pluginName: PLUGIN_NAME,
    },
    {
      section: 'plugins',
      displayName: 'Update',
      uid: 'update',
      pluginName: PLUGIN_NAME,
    },
    {
      section: 'plugins',
      displayName: 'Delete',
      uid: 'delete',
      pluginName: PLUGIN_NAME,
    },
    // Settings
    {
      section: 'plugins',
      displayName: 'Read',
      subCategory: 'settings',
      uid: 'settings.read',
      pluginName: PLUGIN_NAME,
    },
    {
      section: 'plugins',
      displayName: 'Update',
      subCategory: 'settings',
      uid: 'settings.update',
      pluginName: PLUGIN_NAME,
    },
  ];

  // Commented out as this was causing issues in clustered instances of Strapi
  // Issue was due to multiple instances of the plugin stampeding Mux's API
  // rate limits.  Future work would include a manual invocation from the
  // plugin's settings page.
  // sync();

  await strapi.admin.services.permission.actionProvider.registerMany(actions);
};

export default bootstrap;
