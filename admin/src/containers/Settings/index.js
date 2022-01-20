const React = require('react');
const { useIntl } = require('react-intl');
const { Formik, FormikHelpers } = require('formik');
const {
  CheckPagePermissions,
  Form,
  SettingsPageTitle,
  useNotification,
  useOverlayBlocker,
  useRBAC
} = require('@strapi/helper-plugin');
const Check = require('@strapi/icons/Check');
const { Box } = require('@strapi/design-system/Box');
const { Button } = require('@strapi/design-system/Button');
const { Grid, GridItem } = require('@strapi/design-system/Grid');
const { HeaderLayout, ContentLayout } = require('@strapi/design-system/Layout');
const { Main } = require('@strapi/design-system/Main');
const { Stack } = require('@strapi/design-system/Stack');
const { TextInput } = require('@strapi/design-system/TextInput');
const { Typography } = require('@strapi/design-system/Typography');

const { setMuxSettings } = require('../../services/strapi');
const pluginPermissions = require('./../../permissions');
const getTrad = require('../../utils/getTrad');

const Settings = () => {  
  const updatePermissions = React.useMemo(
    () => ({ update: pluginPermissions.settingsUpdate }),
    []
  );

  // const {
  //   isLoading: isLoadingForPermissions,
  //   allowedActions: { canUpdate },
  // } = useRBAC(updatePermissions);

  // const { lockApp, unlockApp } = useOverlayBlocker();
  // const notification = useNotification();
  
  const { formatMessage } = useIntl();

  const handleSubmit = async (body, { resetForm }) => {
    // lockApp();

    const formData = new FormData();

    if(body.access_token) {
      formData.append("access_token", body.access_token);
    }
    
    if(body.secret_key) {
      formData.append("secret_key", body.secret_key);
    }
    
    if(body.webhook_signing_secret) {
      formData.append("webhook_signing_secret", body.webhook_signing_secret);
    }
    
    if (formData.entries().next().done) {
      // notification({
      //   type: 'info',
      //   message: { id: getTrad('notification.noChanges'), defaultMessage: 'No changes made' },
      // });

      // unlockApp();
      return;
    }

    const response = await setMuxSettings(formData);

    if (response.status === 200) {
      // notification({
      //   type: 'success',
      //   message: { id: getTrad('notification.changesSaved'), defaultMessage: 'Changes saved' },
      // });

      resetForm();
    } else {
      // notification({
      //   type: 'warning',
      //   message: { id: getTrad('notification.errorSaving'), defaultMessage: 'Error while saving changes' },
      // });
    }

    // unlockApp();
  };

  return (
    <div>
    {/* <CheckPagePermissions permissions={pluginPermissions.settingsRoles}> */}
      <Main>
        <SettingsPageTitle
          name={formatMessage({
            id: getTrad('SettingsNav.section-label'),
            defaultMessage: 'Mux Video Uploader',
          })}
        />
        <Formik
          onSubmit={handleSubmit}
          initialValues={INITIAL_VALUES}
          validateOnChange={false}
          enableReinitialize
        >
          {({ errors, values, handleChange, isSubmitting }) => {
            return (
              <Form>
                <HeaderLayout
                  title={formatMessage({
                    id: getTrad('SettingsNav.section-label'),
                    defaultMessage: 'Mux Video Uploader',
                  })}
                  primaryAction={
                    <Button
                      loading={isSubmitting}
                      type="submit"
                      // disabled={!canUpdate}
                      startIcon={<Check />}
                      size="L"
                    >
                      {formatMessage({ id: getTrad('Form.save'), defaultMessage: 'Save' })}
                    </Button>
                  }
                />
                <ContentLayout>
                  <Box
                    background="neutral0"
                    hasRadius
                    shadow="filterShadow"
                    paddingTop={6}
                    paddingBottom={6}
                    paddingLeft={7}
                    paddingRight={7}
                  >
                    <Stack size={4}>
                      <Typography variant="delta" as="h2">
                        {formatMessage({
                          id: getTrad('SettingsNav.link.settings'),
                          defaultMessage: 'Settings',
                        })}
                      </Typography>
                      <Grid gap={6}>
                        <GridItem col={6} s={12}>
                          <TextInput
                            label="Access Token"
                            name="access_token"
                            placeholder="Mux access token"
                            value={values.access_token}
                            error={errors && errors.access_token}
                            // onChange={(e: InputTextOnChange) => handleChange({ target: { name: 'access_token', value: e } })}
                            onChange={handleChange}
                          />
                        </GridItem>
                      </Grid>
                      <Grid gap={6}>
                        <GridItem col={6} s={12}>
                          <TextInput
                            label="Secret Key"
                            name="secret_key"
                            type="password"
                            placeholder="Mux secret key"
                            value={values.secret_key}
                            error={errors && errors.secret_key}
                            // onChange={(e: InputTextOnChange) => handleChange({ target: { name: 'secret_key', value: e } })}
                            onChange={handleChange}
                          />
                        </GridItem>
                      </Grid>
                      <Grid gap={6}>
                        <GridItem col={6} s={12}>
                          <TextInput
                            label="Webhook Signing Secret"
                            name="webhook_signing_secret"
                            type="password"
                            placeholder="Mux webhook signing secret"
                            value={values.webhook_signing_secret}
                            error={errors && errors.webhook_signing_secret}
                            // onChange={(e: InputTextOnChange) => handleChange({ target: { name: 'webhook_signing_secret', value: e } })}
                            onChange={handleChange}
                          />
                        </GridItem>
                      </Grid>
                    </Stack>
                  </Box>
                </ContentLayout>
              </Form>
            );
          }}
        </Formik>
      </Main>
    {/* </CheckPagePermissions> */}
    </div>
  );
};

export default Settings;
