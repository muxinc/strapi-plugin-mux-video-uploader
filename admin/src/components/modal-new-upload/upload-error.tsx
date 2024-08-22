import React from 'react';
import { useIntl } from 'react-intl';
import { WarningCircle } from '@strapi/icons';
import { Box, Flex, Typography } from '@strapi/design-system';

import getTrad from '../../utils/get-trad';

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
              id: getTrad('UploadError.upload-error'),
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
            id: getTrad('UploadError.message'),
            defaultMessage:
              'An error occurred while uploading the file.  Submit an issue with the following error message',
          })}
          &nbsp;-&nbsp;
          <a href="https://github.com/muxinc/strapi-plugin-mux-video-uploader/issues" target="_blank">
            {formatMessage({
              id: getTrad('UploadError.issues'),
              defaultMessage: 'File issue',
            })}
          </a>
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
