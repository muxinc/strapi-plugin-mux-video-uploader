import { muxVideoUploaderCustomField } from './mux-video-uploader';

export const registerCustomFields = (app: any) => {
  if (!canRegister(app)) {
    return;
  }

  app.customFields.register(muxVideoUploaderCustomField);
};

const canRegister = (app: any) => !!app.customFields;
