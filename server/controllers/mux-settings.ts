import { pick, isEmpty } from 'lodash';
import { Context } from 'koa';

import { Config } from '../utils';

const isConfiged = async (ctx: Context) => {
  const config = await Config.getConfig('general');

  if (!config.access_token) ctx.send(false);
  else if (!config.secret_key) ctx.send(false);
  else if (!config.webhook_signing_secret) ctx.send(false);
  else if (!config.playback_key_id) ctx.send(false);
  else if (!config.playback_key_secret) ctx.send(false);
  else ctx.send(true);
};

const loadConfig = async (ctx: Context) => {
  const config = await Config.getConfig('general');

  ctx.send(config);
};

const clearConfig = async (ctx: Context) => {
  await Config.deleteConfig('general');

  ctx.send({ message: 'ok' });
};

const saveConfig = async (ctx: Context) => {
  const config = pick(
    ctx.request.body,
    'access_token',
    'secret_key',
    'webhook_signing_secret',
    'playback_key_id',
    'playback_key_secret',
    'playback_expiration'
  );

  let successful = false;

  if (!isEmpty(config)) {
    successful = await Config.setConfig('general', config);
  }

  if (isEmpty(config) || !successful) {
    ctx.send({ message: `Nothing to update` });
  } else {
    ctx.send({ message: `Updated ${Object.keys(config).join(', ')}` });
  }
};

export = {
  isConfiged,
  loadConfig,
  clearConfig,
  saveConfig,
};
