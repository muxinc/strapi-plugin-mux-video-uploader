import { CONFIG_NAME, PLUGIN_NAME } from './../constants';
import * as Config from './config';

const getCoreStore = () => {
  return strapi.store({ type: 'plugin', name: CONFIG_NAME });
};

const getService = (name: string) => {
  return strapi.plugin(PLUGIN_NAME).service(name);
};

export {
  getCoreStore,
  getService,
  Config
};
