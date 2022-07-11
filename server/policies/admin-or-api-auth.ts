import * as authStrategies from '@strapi/admin/server/strategies';

export default async (ctx: any) => {
  const user = await authStrategies.admin.authenticate(ctx);

  if (user.authenticated) {
    return true;
  } else {
    const api = await authStrategies['api-token'].authenticate(ctx);

    return api.authenticated;
  }
};
