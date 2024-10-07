import React from 'react';
import { useIntl } from 'react-intl';
import { WarningCircle } from '@strapi/icons';
import { Box, Flex, Link, Typography } from '@strapi/design-system';

import { getTranslation } from '../../utils/getTranslation';

interface Props {
  message: string;
}

const UploadError = (props: Props) => {
  const { message } = props;

  const { formatMessage } = useIntl();

  return (
    <>
      <Box paddingTop={5}>
        <Flex justifyContent="center">
          <Typography variant="alpha">
            {formatMessage({
              id: getTranslation('UploadError.upload-error'),
              defaultMessage: 'Upload Error',
            })}
            &nbsp;
            <WarningCircle color="danger600" />
          </Typography>
        </Flex>
      </Box>
      <Box paddingTop={5}>
        <Typography variant="omega">
          {formatMessage({
            id: getTranslation('UploadError.message'),
            defaultMessage:
              'An error occurred while uploading the file.  Submit an issue with the following error message',
          })}
          &nbsp;-&nbsp;
          <Link isExternal href="https://github.com/muxinc/strapi-plugin-mux-video-uploader/issues">
            {formatMessage({
              id: getTranslation('UploadError.issues'),
              defaultMessage: 'File issue',
            })}
          </Link>
        </Typography>
      </Box>
      <Box paddingTop={5}>
        <Typography variant="omega" textColor="danger500">
          {message}
        </Typography>
      </Box>
    </>
  );
};

export default UploadError;
