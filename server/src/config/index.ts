import { Config } from '../utils/config';

export default {
  default: {
    accessTokenId: '',
    secretKey: '',
    webhookSigningSecret: '',
    playbackSigningId: '',
    playbackSigningSecret: '',
    defaultDirectiveIds: [],
  },
  validator(config: Config) {
    const missingConfigs = [];

    if (!config.accessTokenId) {
      missingConfigs.push('accessTokenId');
    }

    if (!config.secretKey) {
      missingConfigs.push('secretKey');
    }

    const { defaultDirectiveIds } = config;

    if (
      defaultDirectiveIds !== undefined &&
      (!Array.isArray(defaultDirectiveIds) ||
        defaultDirectiveIds.some((id) => typeof id !== 'string' || id.trim() === ''))
    ) {
      throw new Error(
        'The "defaultDirectiveIds" config of the Mux Video Uploader plugin must be a list of Robots directive ids, such as ["drv_..."].'
      );
    }

    if (missingConfigs.length > 0) {
      throw new Error(
        `Please remember to set up the file based config for your plugin.  Refer to the "Configuration" of the README for this plugin for additional details.  Configs missing: ${missingConfigs.join(', ')}`
      );
    }
  },
};
