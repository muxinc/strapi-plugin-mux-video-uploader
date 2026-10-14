import { PLUGIN_NAME } from '../constants';

export type PluginAction = 'read' | 'create' | 'update' | 'delete' | 'robots.run';

/** The same permissions the admin UI checks before showing an action. */
export const can = (action: PluginAction) => ({
  name: 'admin::hasPermissions',
  config: { actions: [`plugin::${PLUGIN_NAME}.${action}`] },
});
