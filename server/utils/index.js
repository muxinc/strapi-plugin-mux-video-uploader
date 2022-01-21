const { CONFIG_NAME, PLUGIN_NAME } = require('./../constants');
const Config = require('./config');
// import { ServiceName, ServiceType } from './types';

const getCoreStore = () => {
  return strapi.store({ type: 'plugin', name: CONFIG_NAME });
};

const getService = (name) => {
  return strapi.plugin(PLUGIN_NAME).service(name);
};

module.exports = {
  getCoreStore,
  getService,
  Config
};
