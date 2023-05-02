import React from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import ExclamationMarkCircle from '@strapi/icons/ExclamationMarkCircle';
import { Box } from '@strapi/design-system/Box';
import { Flex } from '@strapi/design-system/Flex';
import { Icon } from '@strapi/design-system/Icon';
import { Stack } from '@strapi/design-system/Stack';
import { Typography } from '@strapi/design-system/Typography';

import getTrad from '../../utils/getTrad';

const IconStyled = styled(Icon)`
  display: inline-block;
`;

interface Props {
  message: string;
}

const UploadError = (props: Props) => {
  const { message } = props;

  const { formatMessage } = useIntl();

  return (
    <Stack>
      <Box paddingTop={5}>
        <Flex justifyContent="center">
          <Typography variant="alpha">
            {formatMessage({
              id: getTrad('UploadError.upload-error'),
              defaultMessage: 'Upload Error',
            })}
            &nbsp;
            <IconStyled color="danger600">
              <ExclamationMarkCircle />
            </IconStyled>
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
    </Stack>
  );
};

export default UploadError;
