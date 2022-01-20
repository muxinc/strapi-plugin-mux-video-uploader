import { CONFIG_NAME, PLUGIN_NAME } from './../constants';
import * as Config from './config';
import { ServiceName, ServiceType } from './types';

const getCoreStore = () => {
  return strapi.store({ type: 'plugin', name: CONFIG_NAME });
};

const getService = (name) => {
  return strapi.plugin(PLUGIN_NAME).service(name);
};

export {
  getCoreStore,
  getService,
  Config
};
