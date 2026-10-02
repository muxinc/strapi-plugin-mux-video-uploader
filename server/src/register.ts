import type { Core } from '@strapi/strapi';

type MiddlewareEntry = string | { name?: string; resolve?: string; config?: Record<string, unknown> };

// strapi::body discards the raw body that signatures cover
const keepRawRequestBody = (strapi: Core.Strapi) => {
  const middlewares = strapi.config.get('middlewares') as MiddlewareEntry[] | undefined;

  if (!Array.isArray(middlewares)) return;

  strapi.config.set(
    'middlewares',
    middlewares.map((middleware) => {
      if (middleware === 'strapi::body') {
        return { name: 'strapi::body', config: { includeUnparsed: true } };
      }

      if (typeof middleware === 'object' && middleware.name === 'strapi::body') {
        if (middleware.config?.includeUnparsed !== undefined) return middleware;

        return { ...middleware, config: { ...middleware.config, includeUnparsed: true } };
      }

      return middleware;
    })
  );
};

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  keepRawRequestBody(strapi);
};

export default register;
