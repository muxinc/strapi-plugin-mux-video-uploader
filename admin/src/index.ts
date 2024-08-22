// import { prefixPluginTranslations } from '@strapi/helper-plugin';

import pluginPkg from '../../package.json';
import pluginId from './plugin-id';
import pluginPermissions from './permissions';
import PluginIcon from './components/icons';
import translations from './translations';
import { prefixPluginTranslations } from './utils/prefix-plugin-translations';

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
        // const component = await import(/* webpackChunkName: "mux-video-uploader" */ './containers/App');
        const component = await import(/* webpackChunkName: "mux-video-uploader" */ './containers/App/index.js');

        return component;
      },
    });

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
