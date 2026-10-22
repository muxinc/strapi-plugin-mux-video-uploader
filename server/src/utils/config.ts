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

/**
 * Trimmed, without blanks or repeats. `env.array('X', [])` reads an empty `X=` as `['']`, and a
 * hand-written list can pad its ids.
 */
export const normalizeDirectiveIds = (ids: unknown): string[] =>
  Array.isArray(ids)
    ? Array.from(new Set(ids.flatMap((id) => (typeof id === 'string' && id.trim() !== '' ? [id.trim()] : []))))
    : [];

const getConfig: GetConfigFunction = async () => {
  const config: Config | undefined = await strapi.config.get(`plugin::${PLUGIN_NAME}`);

  return { ...config, defaultDirectiveIds: normalizeDirectiveIds(config?.defaultDirectiveIds) };
};

export { getConfig };
