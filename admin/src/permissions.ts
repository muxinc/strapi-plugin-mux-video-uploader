import { PLUGIN_ID } from './pluginId';

const settingsRead = { action: `plugin::${PLUGIN_ID}.settings.read`, subject: null };
const settingsUpdate = { action: `plugin::${PLUGIN_ID}.settings.update`, subject: null };
const mainRead = { action: `plugin::${PLUGIN_ID}.read`, subject: null };
const mainCreate = { action: `plugin::${PLUGIN_ID}.create`, subject: null };
const mainUpdate = { action: `plugin::${PLUGIN_ID}.update`, subject: null };
const mainDelete = { action: `plugin::${PLUGIN_ID}.delete`, subject: null };

const pluginPermissions = {
  // This permission regards the main component (App) and is used to tell
  // If the plugin link should be displayed in the menu
  // And also if the plugin is accessible. This use case is found when a user types the url of the
  // plugin directly in the browser
  settingsRoles: new Array().concat(settingsRead, settingsUpdate),
  settingsRead,
  settingsUpdate,
  mainRead,
  mainCreate,
  mainUpdate,
  mainDelete,
};

export default pluginPermissions;
