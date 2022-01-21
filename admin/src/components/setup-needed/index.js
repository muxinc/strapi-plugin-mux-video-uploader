const React = require('react');
const { useIntl } = require('react-intl');
const { useHistory } = require("react-router-dom");
const { Box } = require('@strapi/design-system/Box');
const { Flex } = require('@strapi/design-system/Flex');
const { Button } = require('@strapi/design-system/Button');
const { Layout, ContentLayout } = require('@strapi/design-system/Layout');
const { Main } = require('@strapi/design-system/Main');
const { Typography } = require('@strapi/design-system/Typography');

const pluginId = require('../../pluginId');
const getTrad = require('../../utils/getTrad');

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

module.exports = SetupNeeded;
