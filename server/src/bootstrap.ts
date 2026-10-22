import type { Core } from '@strapi/strapi';

import { PLUGIN_NAME } from './constants/index';
import { Config } from './utils';

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
    // Its own permission because running Robots spends Mux AI units. Seeing results needs only Read.
    {
      section: 'plugins',
      displayName: 'Run Robots',
      uid: 'robots.run',
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

  const { webhookSigningSecret } = await Config.getConfig();

  if (!webhookSigningSecret) {
    strapi.log.warn(
      '[mux-video-uploader] webhookSigningSecret is empty. Every Mux webhook will be rejected with 401 and ' +
        'new uploads will stay in "Preparing". Copy the signing secret from Mux → Settings → Webhooks.'
    );
  }

  // `register` adds `includeUnparsed: true` to `strapi::body`, but leaves an explicit `false` alone.
  if (bodyMiddlewareDropsRawBody(strapi)) {
    strapi.log.warn(
      '[mux-video-uploader] strapi::body sets includeUnparsed: false in config/middlewares. Mux webhooks need ' +
        'the raw request body to verify their signature, so every one will be rejected with 500 and new uploads ' +
        'will stay in "Preparing". Remove the option or set it to true.'
    );
  }
};

const bodyMiddlewareDropsRawBody = (strapi: Core.Strapi) => {
  const middlewares = strapi.config.get('middlewares') as unknown;
  if (!Array.isArray(middlewares)) return false;

  return middlewares.some(
    (middleware) =>
      typeof middleware === 'object' &&
      middleware?.name === 'strapi::body' &&
      middleware.config?.includeUnparsed === false
  );
};

export default bootstrap;
