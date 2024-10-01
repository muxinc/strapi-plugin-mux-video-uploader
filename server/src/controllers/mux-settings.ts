import { Context } from 'koa';

import { Config } from '../utils';

const isConfigured = async (ctx: Context) => {
  const { accessTokenId, secretKey, webhookSigningSecret } = await Config.getConfig();

  if (!accessTokenId) ctx.send(false);
  else if (!secretKey) ctx.send(false);
  else if (!webhookSigningSecret) ctx.send(false);
  else ctx.send(true);
};

export default { isConfigured };
