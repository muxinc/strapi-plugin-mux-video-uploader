import { FormikErrors } from 'formik';
import {
  RequestedUploadConfig,
  UploadConfig,
  UploadData,
  type RequestedUploadData,
} from '../../../../types/shared-types';
import type { FormatMessage, TranslationKey } from '../../utils/use-plugin-intl';

export const NEW_UPLOAD_INITIAL_VALUES: RequestedUploadData = {
  ...UploadConfig.parse({} as RequestedUploadConfig),
  title: '',
  upload_type: 'file',
  // @ts-expect-error initialize the form without a file. It'll be properly validated before submission
  file: undefined,
};

export const generateUploadInfo = ({
  body,
  formatMessage,
}: {
  body: Partial<RequestedUploadData>;
  formatMessage: FormatMessage;
}): RequestedUploadData => {
  const errors: FormikErrors<RequestedUploadData> = {};
  const parsed = UploadData.safeParse(body);

  if (parsed.success) return parsed.data;

  parsed.error.issues.forEach((issue) => {
    const issuePath = (Array.isArray(issue.path) ? issue.path.join('.') : issue.path) as keyof typeof errors;
    errors[issuePath] = formatMessage(`ModalNewUpload.formErrors.${issuePath}` as TranslationKey, issue.message);
  });
  throw errors;
};
