const { pick, isEmpty } = require('lodash');

const { setConfig, getConfig, deleteConfig } = require("../services/mux");

module.exports = {
  isConfiged: async (ctx) => {
    const config = await getConfig('general');

    if(!config.access_token) ctx.send(false);
    else if(!config.secret_key) ctx.send(false);
    else if(!config.webhook_signing_secret) ctx.send(false);
    else ctx.send(true);
  },

  clearConfig: async (ctx) => {
    await deleteConfig('general');

    ctx.send({ message: 'ok' });
  },

  saveConfig: async (ctx) => {
    const config = pick(ctx.request.body, 'access_token', 'secret_key', 'webhook_signing_secret');

    let successful = false;

    if(!isEmpty(config)) {
      successful = await setConfig('general', config);
    }

    if(isEmpty(config) || !successful) {
      ctx.send({ message: `Nothing to update` });
    } else {
      ctx.send({ message: `Updated ${Object.keys(config).join(', ')}` });
    }
  }
};
