import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import App from './containers/App';
import Initializer from './containers/Initializer';
import lifecycles from './lifecycles';
import trads from './translations';
import Settings from './containers/Settings';
import getTrad from './utils/getTrad';
import pluginPermissions from './permissions';

export default (strapi:any) => {
  const pluginDescription = pluginPkg.strapi.description || pluginPkg.description;
  const icon = pluginPkg.strapi.icon;
  const name = pluginPkg.strapi.name;

  const plugin = {
    blockerComponent: null,
    blockerComponentProps: {},
    description: pluginDescription,
    icon,
    id: pluginId,
    initializer: Initializer,
    injectedComponents: [],
    isReady: false,
    // @ts-ignore
    isRequired: pluginPkg.strapi.required || false,
    layout: null,
    lifecycles,
    mainComponent: App,
    name,
    preventComponentRendering: false,
    trads,
    settings: {
      menuSection: {
        id: pluginId,
        title: getTrad('SettingsNav.section-label'),
        links: [
          {
            title: {
              id: getTrad('SettingsNav.link.settings'),
              defaultMessage: 'Settings',
            },
            name: 'settings',
            to: `${strapi.settingsBaseURL}/${pluginId}`,
            Component: Settings,
            permissions: pluginPermissions.settings
          },
        ],
      }
    },
    menu: {
      pluginsSectionLinks: [
        {
          destination: `/plugins/${pluginId}`,
          icon,
          label: {
            id: `${pluginId}.plugin.name`,
            defaultMessage: name,
          },
          name,
          permissions: pluginPermissions.main
        },
      ],
    },
  };

  return strapi.registerPlugin(plugin);
};
