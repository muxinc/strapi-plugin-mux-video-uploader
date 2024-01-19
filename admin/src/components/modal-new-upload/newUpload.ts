import { FormikErrors } from 'formik';
import { IntlShape } from 'react-intl';
import { RequestedUploadConfig, UploadConfig } from '../../../../types/shared-types';
import { UploadInfo } from '../../services/strapi';
import getTrad from '../../utils/getTrad';

export type NewUploadFormValues = RequestedUploadConfig & {
  title: string;

  file?: File[];
  url?: string;
};

export const NEW_UPLOAD_INITIAL_VALUES: NewUploadFormValues = {
  title: '',
  file: undefined,
  ...UploadConfig.parse({} as RequestedUploadConfig),
};

export const generateUploadInfo = ({
  body,
  formatMessage,
}: {
  body: NewUploadFormValues;
  formatMessage: IntlShape['formatMessage'];
}): UploadInfo => {
  const errors: FormikErrors<NewUploadFormValues> = {};

  let uploadInfo: UploadInfo | undefined;
  const uploadConfig = UploadConfig.safeParse(body);

  if (!uploadConfig.success) {
    uploadConfig.error.issues.forEach((issue) => {
      errors[(Array.isArray(issue.path) ? issue.path.join('.') : issue.path) as keyof typeof errors] = issue.message;
    });
    throw errors;
  }

  if (!body.title) {
    errors.title = formatMessage({
      id: getTrad('Common.title-required'),
      defaultMessage: 'No title specified',
    });
  }

  if (body.title.length < 3) {
    errors.title = formatMessage({
      id: getTrad('Common.title-length'),
      defaultMessage: 'Needs to be at least 3 letters',
    });
  }

  if (uploadConfig.data.upload_type === 'file' && !body.file) {
    errors.file = formatMessage({
      id: getTrad('Common.file-required'),
      defaultMessage: 'File needs to be selected',
    });
  }

  if (uploadConfig.data.upload_type === 'url' && !body.url) {
    errors.url = formatMessage({
      id: getTrad('Common.url-required'),
      defaultMessage: 'No url specified',
    });
  }

  if (Object.entries(errors).length > 0) {
    throw errors;
  }

  return {
    ...uploadConfig.data,
    title: body.title,
    media: (uploadConfig.data.upload_type === 'file' ? body.file : body.url) as UploadInfo['media'],
  };
};
