const { pick, isEmpty } = require('lodash');

const { Config } = require("../utils");

const isConfiged = async (ctx) => {
  const config = await Config.getConfig('general');

  if(!config.access_token) ctx.send(false);
  else if(!config.secret_key) ctx.send(false);
  else if(!config.webhook_signing_secret) ctx.send(false);
  else ctx.send(true);
};

const clearConfig = async (ctx) => {
  await Config.deleteConfig('general');

  ctx.send({ message: 'ok' });
};

const saveConfig = async (ctx) => {
  const config = pick(ctx.request.body, 'access_token', 'secret_key', 'webhook_signing_secret');

  let successful = false;

  if(!isEmpty(config)) {
    successful = await Config.setConfig('general', config);
  }

  if(isEmpty(config) || !successful) {
    ctx.send({ message: `Nothing to update` });
  } else {
    ctx.send({ message: `Updated ${Object.keys(config).join(', ')}` });
  }
};

module.exports = {
  isConfiged,
  clearConfig,
  saveConfig
};
