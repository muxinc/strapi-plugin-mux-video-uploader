import { CONFIG_NAME } from '../constants';

interface Config {
  access_token?: string;
  secret_key?: string;
  playback_signing_secret?: string;
  playback_signing_id?: string;
}

type GetConfigFunction = () => Promise<Config>;

const getConfig: GetConfigFunction = async () => await strapi.config.get(`plugin::${CONFIG_NAME}`);

export { getConfig };
