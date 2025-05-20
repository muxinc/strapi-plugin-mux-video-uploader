import type { Core } from '@strapi/strapi';
declare const bootstrap: ({ strapi }: {
    strapi: Core.Strapi;
}) => Promise<void>;
export default bootstrap;
