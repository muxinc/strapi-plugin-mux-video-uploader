import { muxVideoUploaderCustomField } from './mux-video-uploader';

export const registerCustomFields = ({ strapi }: any) => {
  if (!canRegister({ strapi })) {
    strapi.log.warn('[mux-video-uploader] Custom fields disabled. Upgrade Strapi to use custom fields.');

    return;
  }

  strapi.customFields.register(muxVideoUploaderCustomField);
};

const canRegister = ({ strapi }: any) => !!strapi.customFields;
