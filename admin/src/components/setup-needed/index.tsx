import React from 'react';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';
import { Box } from '@strapi/design-system/Box';
import { Button } from '@strapi/design-system/Button';
import { BaseHeaderLayout, Layout, ContentLayout } from '@strapi/design-system/Layout';
import { Main } from '@strapi/design-system/Main';
import { Typography } from '@strapi/design-system/Typography';
import ArrowRight from '@strapi/icons/ArrowRight';

import pluginId from '../../plugin-id';
import getTrad from '../../utils/get-trad';

const SetupNeeded = () => {
  const history = useHistory();
  const { formatMessage } = useIntl();

  const onSettingsClick = () => history.push(`/settings/${pluginId}`);

  return (
    <Layout>
      <Box background="neutral100">
        <BaseHeaderLayout
          title={formatMessage({ id: getTrad('SetupNeeded.page-title'), defaultMessage: 'Mux Video Uploader' })}
          as="h1"
        />
      </Box>
      <Main>
        <ContentLayout>
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
                {formatMessage({ id: getTrad('SetupNeeded.setup-needed'), defaultMessage: 'Setup Needed' })}
              </Typography>
              <Box paddingTop={3} paddingBottom={3}>
                <Typography variant="omega">
                  {formatMessage({
                    id: getTrad('SetupNeeded.setup-instructions'),
                    defaultMessage:
                      'In order for uploads to function, an administrator will need to complete the setup of this plugin by visiting the settings page.  Click the button below to be taken there now.',
                  })}
                </Typography>
              </Box>
              <Button size="S" onClick={onSettingsClick} endIcon={<ArrowRight />}>
                {formatMessage({ id: getTrad('SetupNeeded.settings'), defaultMessage: 'Go to settings' })}
              </Button>
            </Box>
          </Box>
        </ContentLayout>
      </Main>
    </Layout>
  );
};

export default SetupNeeded;
