const _ = require('lodash');

const NAME = 'mux';
const CONFIG_KEY = 'config';

const getStore = () => strapi.store({
  environment: strapi.config.environment,
  type: 'plugin',
  name: NAME,
});

function configKey(key) { return `${CONFIG_KEY}_${key}` };

module.exports = {
  deleteConfig: key => strapi.query('core_store').delete(
    { key: `plugin_${NAME}_${CONFIG_KEY}_${key}` }),

  getConfig: async (key) => (await getStore().get({ key: configKey(key) })) || {},

  setConfig: async (key, value) => {
    const storedConfig = (await getStore().get({ key: configKey(key) })) || {};

    const currentConfig = { ...storedConfig };
    
    Object.keys(value).forEach(key => {
      if (value[key] !== null && value[key] !== undefined) {
        _.set(currentConfig, key, value[key]);
      }
    });

    if (!_.isEqual(currentConfig, storedConfig)) { 
      getStore().set({
        key: configKey(key),
        value: currentConfig,
      });

      return true;
    }

    return false;
  }
};
