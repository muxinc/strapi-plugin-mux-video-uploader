const { prefixPluginTranslations } = require('@strapi/helper-plugin');

const pluginPkg = require('../../package.json');
const pluginId = require('./pluginId');
const pluginPermissions = require('./permissions');
const PluginIcon = require('./components/icons');
const getTrad = require('./utils/getTrad');

const name = pluginPkg.strapi.name;

module.exports = {
  register(app) {
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: name,
      },
      permissions: pluginPermissions.main,
      Component: async () => { 
        const component = await import(
          /* webpackChunkName: "mux-video-uploader" */ './containers/HomePage'
        );

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
          // permissions: pluginPermissions.settingsRoles,
          Component: async () => {
            const component = await import(
              /* webpackChunkName: "mux-video-uploader-settings-page" */ './containers/Settings'
            );

            return component;
          },
        }
      ]
    );

    app.registerPlugin({
      id: pluginId,
      name,
    });
  },
  bootstrap() {},
  async registerTrads({ locales }) {
    const constedTrads = await Promise.all(
      locales.map((locale) => {
        return import(
          /* webpackChunkName: "users-permissions-translation-[request]" */ `./translations/${locale}.json`
        )
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, pluginId),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return Promise.resolve(constedTrads);
  },
};
