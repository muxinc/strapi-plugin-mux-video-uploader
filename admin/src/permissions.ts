import pluginId from './pluginId';

const settingsRead = [{ action: `plugin::${pluginId}.settings.read`, subject: null }];
const settingsUpdate = [{ action: `plugin::${pluginId}.settings.update`, subject: null }];
const mainRead = [{ action: `plugin::${pluginId}.read`, subject: null }];
const mainCreate = [{ action: `plugin::${pluginId}.create`, subject: null }];
const mainUpdate = [{ action: `plugin::${pluginId}.update`, subject: null }];
const mainDelete = [{ action: `plugin::${pluginId}.delete`, subject: null }];

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
  mainDelete
};

export default pluginPermissions;
