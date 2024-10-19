import { Config } from '../utils/config';

export default {
  default: {
    accessTokenId: '',
    secretKey: '',
    webhookSigningSecret: '',
    playbackSigningId: '',
    playbackSigningSecret: '',
  },
  validator(config: Config) {
    const missingConfigs = [];

    if (!config.accessTokenId) {
      missingConfigs.push('accessTokenId');
    }

    if (!config.secretKey) {
      missingConfigs.push('secretKey');
    }

    if (missingConfigs.length > 0) {
      throw new Error(
        `Please remember to set up the file based config for your plugin.  Refer to the "Configuration" of the README for this plugin for additional details.  Configs missing: ${missingConfigs.join(', ')}`
      );
    }
  },
};
