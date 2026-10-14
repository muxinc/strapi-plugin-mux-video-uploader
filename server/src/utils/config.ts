import { PLUGIN_NAME } from '../constants';

export interface Config {
  accessTokenId?: string;
  secretKey?: string;
  webhookSigningSecret?: string;
  playbackSigningId?: string;
  playbackSigningSecret?: string;
  /** Robots directives attached to every new upload. */
  defaultDirectiveIds?: string[];
}

type GetConfigFunction = () => Promise<Config>;

const getConfig: GetConfigFunction = async () => await strapi.config.get(`plugin::${PLUGIN_NAME}`);

export { getConfig };
