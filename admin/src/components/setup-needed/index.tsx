import React from 'react';
import { useIntl } from 'react-intl';
import { useHistory } from "react-router-dom";
import { Box } from '@strapi/design-system/Box';
import { Flex } from '@strapi/design-system/Flex';
import { Button } from '@strapi/design-system/Button';
import { Layout, ContentLayout } from '@strapi/design-system/Layout';
import { Main } from '@strapi/design-system/Main';
import { Typography } from '@strapi/design-system/Typography';

import pluginId from '../../pluginId';
import getTrad from '../../utils/getTrad';

const SetupNeeded = () => {
  const history = useHistory();
  const { formatMessage } = useIntl();

  const onSettingsClick = () => {
    history.push(`/settings/${pluginId}`);
  };

  return (
    <Layout>
      <Main>
        <ContentLayout>
          <Box paddingTop={8}>
            <Box
              background="neutral0"
              hasRadius
              shadow="filterShadow"
              paddingTop={6}
              paddingBottom={6}
              paddingLeft={7}
              paddingRight={7}
            >
              <Flex direction="column" alignItems="center">
                <Typography variant="alpha">
                  {formatMessage({ id: getTrad('SetupNeeded.setupNeeded'), defaultMessage: 'Setup Needed' })}
                </Typography>
                <Box paddingTop={5} paddingBottom={5}>
                  <Typography variant="omega">
                    {formatMessage({ id: getTrad('SetupNeeded.setupInstructions'), defaultMessage: 'In order for uploads to function, an administrator will need to complete the setup of this plugin by visiting the settings page.  Click the button below to be taken there now.' })}
                  </Typography>
                </Box>
                <Button size="L" onClick={onSettingsClick}>
                  {formatMessage({ id: getTrad('SetupNeeded.settings'), defaultMessage: 'Settings' })}
                </Button>
              </Flex>
            </Box>
          </Box>
        </ContentLayout>
      </Main>
    </Layout>
  );
};

export default SetupNeeded;
