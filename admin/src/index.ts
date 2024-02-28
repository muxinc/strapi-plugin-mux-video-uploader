import { prefixPluginTranslations } from '@strapi/helper-plugin';

import pluginPkg from '../../package.json';
import pluginId from './plugin-id';
import pluginPermissions from './permissions';
import PluginIcon from './components/icons';
import getTrad from './utils/get-trad';
import translations from './translations';

const name = pluginPkg.strapi.name;
const displayName = pluginPkg.strapi.displayName;

export default {
  register(app: any) {
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: displayName,
      },
      permissions: pluginPermissions.mainRead,
      Component: async () => {
        const component = await import(/* webpackChunkName: "mux-video-uploader" */ './containers/App');

        return component;
      },
    });

    app.createSettingSection(
      {
        id: pluginId,
        intlLabel: {
          id: getTrad('SettingsNav.section-label'),
          defaultMessage: 'Mux Video Uploader plugin',
        },
      },
      [
        {
          intlLabel: {
            id: getTrad('SettingsNav.link.settings'),
            defaultMessage: 'Settings',
          },
          id: 'mux-video-uploader-settings',
          to: `/settings/${pluginId}`,
          permissions: pluginPermissions.settingsRoles,
          Component: async () => {
            const component = await import(
              /* webpackChunkName: "mux-video-uploader-settings-page" */ './containers/Settings'
            );

            return component;
          },
        },
      ]
    );

    app.registerPlugin({
      id: pluginId,
      name,
    });
  },
  bootstrap() {},

  async registerTrads(app: any) {
    const { locales } = app;

    return locales.flatMap((locale: keyof typeof translations) => {
      const localeTranslations = translations[locale];
      return localeTranslations ? { data: prefixPluginTranslations(localeTranslations, pluginId), locale } : [];
    });
  },
};
