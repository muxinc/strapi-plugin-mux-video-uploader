import React from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { } from '@strapi/core';
import { Box, Button, Typography } from '@strapi/design-system';
import { ArrowRight } from '@strapi/icons';

import { PLUGIN_ID } from '../../pluginId';
import { getTranslation } from '../../utils/getTranslation';

const SetupNeeded = () => {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();

  const onSettingsClick = () => navigate(`/settings/${PLUGIN_ID}`);

  return (
    <>
      <Box background="neutral100">
        <Typography variant="alpha">
        {formatMessage({ id: getTranslation('SetupNeeded.page-title'), defaultMessage: 'Mux Video Uploader' })}
        </Typography>
      </Box>
      <div>
        <Box>
          <Box
            background="neutral0"
            hasRadius
            shadow="filterShadow"
            paddingTop={6}
            paddingBottom={6}
            paddingLeft={6}
            paddingRight={6}
          >
            <Typography variant="delta">
              {formatMessage({ id: getTranslation('SetupNeeded.setup-needed'), defaultMessage: 'Setup Needed' })}
            </Typography>
            <Box paddingTop={3} paddingBottom={3}>
              <Typography variant="omega">
                {formatMessage({
                  id: getTranslation('SetupNeeded.setup-instructions'),
                  defaultMessage:
                    'In order for uploads to function, an administrator will need to complete the setup of this plugin by visiting the settings page.  Click the button below to be taken there now.',
                })}
              </Typography>
            </Box>
            <Button size="S" onClick={onSettingsClick} endIcon={<ArrowRight />}>
              {formatMessage({ id: getTranslation('SetupNeeded.settings'), defaultMessage: 'Go to settings' })}
            </Button>
          </Box>
        </Box>
      </div>
    </>
  );
};

export default SetupNeeded;
