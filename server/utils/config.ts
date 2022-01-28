import { isEqual, set } from 'lodash';

import { CONFIG_KEY, CONFIG_NAME } from './../constants';
import { getCoreStore } from './';

function configKey(key:string) { return `${CONFIG_KEY}_${key}` };

const deleteConfig = (key:string) => strapi.query('core_store').delete(
  { key: `plugin_${CONFIG_NAME}_${CONFIG_KEY}_${key}` });

const getConfig = async (key:string) => (await getCoreStore().get({ key: configKey(key) })) || {};

const setConfig = async (key:string, value:any) => {
  const storedConfig = (await getCoreStore().get({ key: configKey(key) })) || {};

  const currentConfig = { ...storedConfig };
  
  Object.keys(value).forEach((key:string) => {
    if (value[key] !== null && value[key] !== undefined) {
      set(currentConfig, key, value[key]);
    }
  });

  if (!isEqual(currentConfig, storedConfig)) { 
    getCoreStore().set({
      key: configKey(key),
      value: currentConfig,
    });

    return true;
  }

  return false;
};
  
export {
  deleteConfig,
  getConfig,
  setConfig
};
