import React from 'react';
import { useIntl } from 'react-intl';
import { Box } from '@strapi/design-system/Box';
import { Stack } from '@strapi/design-system/Stack';
import { Typography } from '@strapi/design-system/Typography';

import getTrad from '../../utils/getTrad';

const Uploaded = () => {
  const { formatMessage } = useIntl();

  return (
    <Stack>
      <Box paddingTop={2}>
        <Typography variant="delta">
          {formatMessage({
            id: getTrad('Uploaded.upload-complete'),
            defaultMessage: 'Video uploaded successfully',
          })}
        </Typography>
      </Box>
      <Box paddingTop={5}>
        <Typography variant="omega">
          {formatMessage({
            id: getTrad('Uploaded.message'),
            defaultMessage:
              'The file has been successfully uploaded to Mux and is now able to be referenced by other Content Types within Strapi.',
          })}
        </Typography>
      </Box>
    </Stack>
  );
};

export default Uploaded;
