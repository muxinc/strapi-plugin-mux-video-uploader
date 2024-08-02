import { CONFIG_NAME } from '../constants';

const getConfig = async () => await strapi.config.get(`plugin::${CONFIG_NAME}`);

export { getConfig };
