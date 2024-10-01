import { PLUGIN_NAME } from '../constants';

interface Config {
  accessTokenId?: string;
  secretKey?: string;
  webhookSigningSecret?: string;
  playbackSigningId?: string;
  playbackSigningSecret?: string;
}

type GetConfigFunction = () => Promise<Config>;

const getConfig: GetConfigFunction = async () => await strapi.config.get(`plugin::${PLUGIN_NAME}`);

export { getConfig };
