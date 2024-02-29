import React from 'react';
import { useIntl } from 'react-intl';
import { FormikHelpers, useFormik } from 'formik';
import {
  CheckPagePermissions,
  SettingsPageTitle,
  useNotification,
  useOverlayBlocker,
  useRBAC,
} from '@strapi/helper-plugin';
import Check from '@strapi/icons/Check';
import { Box } from '@strapi/design-system/Box';
import { Button } from '@strapi/design-system/Button';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import { HeaderLayout, ContentLayout } from '@strapi/design-system/Layout';
import { Main } from '@strapi/design-system/Main';
import { Stack } from '@strapi/design-system/Stack';
import { Typography } from '@strapi/design-system/Typography';

import { setMuxSettings } from '../../services/strapi';
import pluginPermissions from '../../permissions';
import getTrad from '../../utils/get-trad';
import SettingsField from './settings-field';

interface FormValues {
  access_token: string;
  secret_key: string;
  webhook_signing_secret: string;
  playback_signing_secret: string;
  playback_signing_id: string;
}

const INITIAL_VALUES: FormValues = {
  access_token: '',
  secret_key: '',
  webhook_signing_secret: '',
  playback_signing_secret: '',
  playback_signing_id: '',
};

const ProtectedSettings = () => (
  <CheckPagePermissions permissions={pluginPermissions.settingsRoles}>
    <Settings />
  </CheckPagePermissions>
);

const Settings = () => {
  const updatePermissions = React.useMemo(() => ({ update: pluginPermissions.settingsUpdate }), []);

  const {
    isLoading,
    allowedActions: { canUpdate },
  } = useRBAC(updatePermissions);

  const { lockApp, unlockApp } = useOverlayBlocker();
  const notification = useNotification();

  const { formatMessage } = useIntl();

  const handleOnSubmit = async (body: FormValues, { resetForm }: FormikHelpers<FormValues>) => {
    lockApp();

    let hasChanged = false;

    const formData = new FormData();

    if (body.access_token) {
      formData.append('access_token', body.access_token);
      hasChanged = true;
    }

    if (body.secret_key) {
      formData.append('secret_key', body.secret_key);
      hasChanged = true;
    }

    if (body.webhook_signing_secret) {
      formData.append('webhook_signing_secret', body.webhook_signing_secret);
      hasChanged = true;
    }

    if (body.playback_signing_secret) {
      formData.append('playback_signing_secret', body.playback_signing_secret);
      hasChanged = true;
    }

    if (body.playback_signing_id) {
      formData.append('playback_signing_id', body.playback_signing_id);
      hasChanged = true;
    }

    if (!hasChanged) {
      notification({
        type: 'info',
        message: { id: getTrad('notification.no-changes'), defaultMessage: 'No changes made' },
      });

      unlockApp();
      return;
    }

    console.log('Form Data: ', formData);

    const response = await setMuxSettings(formData);

    if (response.status === 200) {
      notification({
        type: 'success',
        message: { id: getTrad('notification.changes-saved'), defaultMessage: 'Changes saved' },
      });

      resetForm();
    } else {
      notification({
        type: 'warning',
        message: { id: getTrad('notification.error-saving'), defaultMessage: 'Error while saving changes' },
      });
    }

    unlockApp();
  };

  const { values, errors, isSubmitting, handleChange, handleSubmit } = useFormik<FormValues>({
    initialValues: INITIAL_VALUES,
    onSubmit: handleOnSubmit,
  });

  if (isLoading) return null;

  return (
    <Main>
      <SettingsPageTitle
        name={formatMessage({ id: getTrad('Settings.page-title'), defaultMessage: 'Mux Video Uploader' })}
      />
      <form onSubmit={handleSubmit}>
        <HeaderLayout
          title={formatMessage({ id: getTrad('Settings.header'), defaultMessage: 'Mux Video Uploader' })}
          primaryAction={
            <Button type="submit" loading={isSubmitting} disabled={!canUpdate} startIcon={<Check />} size="L">
              {formatMessage({ id: getTrad('Common.save-button'), defaultMessage: 'Save' })}
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
                {formatMessage({ id: getTrad('Settings.section-header'), defaultMessage: 'Settings' })}
              </Typography>
              <Grid gap={6}>
                <GridItem col={6} s={12}>
                  <SettingsField
                    name="access_token"
                    label={formatMessage({
                      id: getTrad('Settings.access-token-label'),
                      defaultMessage: 'Access Token ID',
                    })}
                    value={values.access_token}
                    placeholder={formatMessage({
                      id: getTrad('Settings.access-token-placeholder'),
                      defaultMessage: 'Mux Access Token ID',
                    })}
                    description={formatMessage({
                      id: getTrad('Settings.access-token-description'),
                      defaultMessage:
                        'Generated in the Mux Dashboard and used for authenticating API calls against Mux',
                    })}
                    detailsLink="https://docs.mux.com/guides/video/make-api-requests#http-basic-auth"
                    error={errors && errors.access_token}
                    onChange={handleChange}
                  />
                </GridItem>
              </Grid>
              <Grid gap={6}>
                <GridItem col={6} s={12}>
                  <SettingsField
                    name="secret_key"
                    label={formatMessage({
                      id: getTrad('Settings.secret-key-label'),
                      defaultMessage: 'Access Token Secret',
                    })}
                    value={values.secret_key}
                    placeholder={formatMessage({
                      id: getTrad('Settings.secret-key-placeholder'),
                      defaultMessage: 'Mux Access Token Secret',
                    })}
                    description={formatMessage({
                      id: getTrad('Settings.secret-key-description'),
                      defaultMessage:
                        'Generated in the Mux Dashboard and used for authenticating API calls against Mux',
                    })}
                    detailsLink="https://docs.mux.com/guides/video/make-api-requests#http-basic-auth"
                    error={errors && errors.secret_key}
                    isPassword
                    onChange={handleChange}
                  />
                </GridItem>
              </Grid>
              <Grid gap={6}>
                <GridItem col={6} s={12}>
                  <SettingsField
                    name="webhook_signing_secret"
                    label={formatMessage({
                      id: getTrad('Settings.webhook-signing-secret-label'),
                      defaultMessage: 'Webhook Signing Secret',
                    })}
                    value={values.webhook_signing_secret}
                    placeholder={formatMessage({
                      id: getTrad('Settings.webhook-signing-secret-placeholder'),
                      defaultMessage: 'Mux Webhook Signing Secret',
                    })}
                    description={formatMessage({
                      id: getTrad('Settings.webhook-signing-secret-description'),
                      defaultMessage: 'Generated in the Mux Dashboard and used for verifying Webhook payloads',
                    })}
                    detailsLink="https://docs.mux.com/guides/video/verify-webhook-signatures"
                    error={errors && errors.webhook_signing_secret}
                    isPassword
                    onChange={handleChange}
                  />
                </GridItem>
              </Grid>
              <Grid gap={6}>
                <GridItem col={6} s={12}>
                  <SettingsField
                    name="playback_signing_id"
                    label={formatMessage({
                      id: getTrad('Settings.playback-signing-id-label'),
                      defaultMessage: 'Playback Signing Id',
                    })}
                    value={values.playback_signing_id}
                    placeholder={formatMessage({
                      id: getTrad('Settings.playback-signing-id-placeholder'),
                      defaultMessage: 'Playback Signing Id',
                    })}
                    description={formatMessage({
                      id: getTrad('Settings.playback-signing-id-description'),
                      defaultMessage: 'Generated in the Mux Dashboard and used for signing Playback Ids',
                    })}
                    detailsLink="https://docs.mux.com/guides/video/verify-webhook-signatures"
                    error={errors && errors.playback_signing_id}
                    onChange={handleChange}
                  />
                </GridItem>
              </Grid>
              <Grid gap={6}>
                <GridItem col={6} s={12}>
                  <SettingsField
                    name="playback_signing_secret"
                    label={formatMessage({
                      id: getTrad('Settings.playback-signing-secret-label'),
                      defaultMessage: 'Playback Signing Secret',
                    })}
                    value={values.playback_signing_secret}
                    placeholder={formatMessage({
                      id: getTrad('Settings.playback-signing-secret-placeholder'),
                      defaultMessage: 'Mux Playback Signing Secret',
                    })}
                    description={formatMessage({
                      id: getTrad('Settings.playback-signing-secret-description'),
                      defaultMessage: 'Generated in the Mux Dashboard and used for signing Playback Ids',
                    })}
                    detailsLink="https://docs.mux.com/guides/video/verify-webhook-signatures"
                    error={errors && errors.playback_signing_secret}
                    onChange={handleChange}
                    isPassword
                  />
                </GridItem>
              </Grid>
            </Stack>
          </Box>
        </ContentLayout>
      </form>
    </Main>
  );
};

export default ProtectedSettings;
