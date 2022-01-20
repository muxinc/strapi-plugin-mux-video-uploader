const _ = require('lodash');

const { CONFIG_KEY, CONFIG_NAME } = require('./../constants');
const { getCoreStore } = require('./');

function configKey(key) { return `${CONFIG_KEY}_${key}` };

const deleteConfig = (key) => strapi.query('core_store').delete(
  { key: `plugin_${CONFIG_NAME}_${CONFIG_KEY}_${key}` });

const getConfig = async (key) => (await getCoreStore().get({ key: configKey(key) })) || {};

const setConfig = async (key, value) => {
  const storedConfig = (await getCoreStore().get({ key: configKey(key) })) || {};

  const currentConfig = { ...storedConfig };
  
  Object.keys(value).forEach((key) => {
    if (value[key] !== null && value[key] !== undefined) {
      _.set(currentConfig, key, value[key]);
    }
  });

  if (!_.isEqual(currentConfig, storedConfig)) { 
    getCoreStore().set({
      key: configKey(key),
      value: currentConfig,
    });

    return true;
  }

  return false;
};
  
module.exports = {
  deleteConfig,
  getConfig,
  setConfig
};
