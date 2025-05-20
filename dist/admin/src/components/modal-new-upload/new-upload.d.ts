import { type RequestedUploadData } from '../../../../types/shared-types';
import type { FormatMessage } from '../../utils/use-plugin-intl';
export declare const NEW_UPLOAD_INITIAL_VALUES: RequestedUploadData;
export declare const generateUploadInfo: ({ body, formatMessage, }: {
    body: Partial<RequestedUploadData>;
    formatMessage: FormatMessage;
}) => RequestedUploadData;
