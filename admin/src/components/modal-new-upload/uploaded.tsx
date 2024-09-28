import React from 'react';
import { useIntl } from 'react-intl';
import { Box, Typography } from '@strapi/design-system';

import { getTranslation } from '../../utils/getTranslation';

const Uploaded = () => {
  const { formatMessage } = useIntl();

  return (
    <>
      <Box paddingTop={2}>
        <Typography variant="delta">
          {formatMessage({
            id: getTranslation('Uploaded.upload-complete'),
            defaultMessage: 'Video uploaded successfully',
          })}
        </Typography>
      </Box>
      <Box paddingTop={5}>
        <Typography variant="omega">
          {formatMessage({
            id: getTranslation('Uploaded.message'),
            defaultMessage:
              'The file has been successfully uploaded to Mux and is now able to be referenced by other Content Types within Strapi.',
          })}
        </Typography>
      </Box>
    </>
  );
};

export default Uploaded;
