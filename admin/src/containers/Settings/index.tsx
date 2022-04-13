import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { FormikHelpers, useFormik } from 'formik';
import {
  CheckPagePermissions,
  SettingsPageTitle,
  useNotification,
  useOverlayBlocker,
  useRBAC
} from '@strapi/helper-plugin';
import Check from '@strapi/icons/Check';
import { Box } from '@strapi/design-system/Box';
import { Button } from '@strapi/design-system/Button';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import { HeaderLayout, ContentLayout } from '@strapi/design-system/Layout';
import { Main } from '@strapi/design-system/Main';
import { Stack } from '@strapi/design-system/Stack';
import { TextInput } from '@strapi/design-system/TextInput';
import { Typography } from '@strapi/design-system/Typography';

import { getMuxSettings, setMuxSettings } from '../../services/strapi';
import pluginPermissions from './../../permissions';
import getTrad from '../../utils/getTrad';
import { useAsync } from '../../hooks/use-async';
import { useState } from 'react';

interface FormValues {
  access_token: string;
  secret_key: string;
  webhook_signing_secret: string;
  playback_key_id: string;
  playback_key_secret: string;
  playback_expiration: string;
}

const ProtectedSettings = () => (
  <CheckPagePermissions permissions={pluginPermissions.settingsRoles}>
    <Settings />
  </CheckPagePermissions>
);

const Settings = () => {  
  const updatePermissions = React.useMemo(
    () => ({ update: pluginPermissions.settingsUpdate }),
    []
  );

  const [ initialValues, setInitialValues ] = useState<FormValues>({
    access_token: '',
    secret_key: '',
    webhook_signing_secret: '',
    playback_key_id: '',
    playback_key_secret: '',
    playback_expiration: ''
  });

  const {
    isLoading,
    allowedActions: { canUpdate },
  } = useRBAC(updatePermissions);

  const { lockApp, unlockApp } = useOverlayBlocker();
  const notification = useNotification();
  
  const { formatMessage } = useIntl();

  const loadConfig = async () => {
    const settings = await getMuxSettings();

    setInitialValues(settings);
  }

  const handleOnSubmit = async (body:FormValues, { resetForm }:FormikHelpers<FormValues>) => {
    lockApp();

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
    
    if(body.playback_key_id) {
      formData.append("playback_key_id", body.playback_key_id);
    }
    
    if(body.playback_key_secret) {
      formData.append("playback_key_secret", body.playback_key_secret);
    }
    
    if(body.playback_expiration) {
      formData.append("playback_expiration", body.playback_expiration);
    }
    
    if (formData.entries().next().done) {
      notification({
        type: 'info',
        message: {
          id: getTrad('notification.no-changes'),
          defaultMessage: 'No changes made'
        },
      });

      unlockApp();
      return;
    }

    const response = await setMuxSettings(formData);

    if (response.status === 200) {
      notification({
        type: 'success',
        message: {
          id: getTrad('notification.changes-saved'),
          defaultMessage: 'Changes saved'
        },
      });

      resetForm();
    } else {
      notification({
        type: 'warning',
        message: {
          id: getTrad('notification.error-saving'),
          defaultMessage: 'Error while saving changes'
        },
      });
    }

    unlockApp();
  };

  const { execute: executeLoadConfig, status: loadConfigStatus } = useAsync<any>(loadConfig, false);
  const { values, errors, isSubmitting, handleChange, handleSubmit } = useFormik<FormValues>({
    initialValues: initialValues,
    enableReinitialize: true,
    onSubmit: handleOnSubmit,
  });

  useEffect(() => {
    executeLoadConfig();
  }, []);

  if (isLoading || loadConfigStatus === 'idle' || loadConfigStatus === 'pending') return null;

  return (
    <Main>
      <SettingsPageTitle
        name={formatMessage({
          id: getTrad('Settings.page-title'),
          defaultMessage: 'Mux Video Uploader'
        })}
      />
      <form onSubmit={handleSubmit}>
        <HeaderLayout
          title={formatMessage({
            id: getTrad('Settings.header'),
            defaultMessage: 'Mux Video Uploader'
          })}
          primaryAction={
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={!canUpdate}
              startIcon={<Check />}
              size="L"
            >
              {
                formatMessage({
                  id: getTrad('Common.save-button'),
                  defaultMessage: 'Save'
                })
              }
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
                {
                  formatMessage({
                    id: getTrad('Settings.section-header'),
                    defaultMessage: 'Settings'
                  })
                }
              </Typography>
              <Grid gap={6}>
                <GridItem col={6} s={12}>
                  <TextInput
                    label={
                      formatMessage({
                        id: getTrad('Settings.access-token-label'),
                        defaultMessage: 'Access Token'
                      })
                    }
                    name="access_token"
                    placeholder={
                      formatMessage({
                        id: getTrad('Settings.access-token-placeholder'),
                        defaultMessage: 'Mux access token'
                      })
                    }
                    value={values.access_token}
                    error={errors && errors.access_token}
                    onChange={handleChange}
                  />
                </GridItem>
              </Grid>
              <Grid gap={6}>
                <GridItem col={6} s={12}>
                  <TextInput
                    label={
                      formatMessage({
                        id: getTrad('Settings.secret-key-label'),
                        defaultMessage: 'Secret Key'
                      })
                    }
                    name="secret_key"
                    type="password"
                    placeholder={
                      formatMessage({
                        id: getTrad('Settings.secret-key-placeholder'),
                        defaultMessage: 'Mux secret key'
                      })
                    }
                    value={values.secret_key}
                    error={errors && errors.secret_key}
                    onChange={handleChange}
                  />
                </GridItem>
              </Grid>
              <Grid gap={6}>
                <GridItem col={6} s={12}>
                  <TextInput
                    label={
                      formatMessage({
                        id: getTrad('Settings.webhook-signing-secret-label'),
                        defaultMessage: 'Webhook Signing Secret'
                      })
                    }
                    name="webhook_signing_secret"
                    type="password"
                    placeholder={
                      formatMessage({
                        id: getTrad('Settings.webhook-signing-secret-placeholder'),
                        defaultMessage: 'Mux webhook signing secret'
                      }) 
                    }
                    value={values.webhook_signing_secret}
                    error={errors && errors.webhook_signing_secret}
                    onChange={handleChange}
                  />
                </GridItem>
              </Grid>
              <Grid gap={6}>
                <GridItem col={6} s={12}>
                  <TextInput
                    label={
                      formatMessage({
                        id: getTrad('Settings.playback-key-id-label'),
                        defaultMessage: 'Playback Key ID'
                      })
                    }
                    name="playback_key_id"
                    placeholder={
                      formatMessage({
                        id: getTrad('Settings.playback-key-id-placeholder'),
                        defaultMessage: 'Mux Playback Key ID'
                      }) 
                    }
                    value={values.playback_key_id}
                    error={errors && errors.playback_key_id}
                    onChange={handleChange}
                  />
                </GridItem>
              </Grid>
              <Grid gap={6}>
                <GridItem col={6} s={12}>
                  <TextInput
                    label={
                      formatMessage({
                        id: getTrad('Settings.playback-key-secret-label'),
                        defaultMessage: 'Playback Key Secret'
                      })
                    }
                    name="playback_key_secret"
                    type="password"
                    placeholder={
                      formatMessage({
                        id: getTrad('Settings.playback-key-secret-placeholder'),
                        defaultMessage: 'Mux Playback Key Secret'
                      }) 
                    }
                    value={values.playback_key_secret}
                    error={errors && errors.playback_key_secret}
                    onChange={handleChange}
                  />
                </GridItem>
              </Grid>
              <Grid gap={6}>
                <GridItem col={6} s={12}>
                  <TextInput
                    label={
                      formatMessage({
                        id: getTrad('Settings.playback-expiration-label'),
                        defaultMessage: 'Playback Expiration'
                      })
                    }
                    name="playback_expiration"
                    placeholder={
                      formatMessage({
                        id: getTrad('Settings.playback-expiration-placeholder'),
                        defaultMessage: `e.g. '1d' or '6h'`
                      }) 
                    }
                    value={values.playback_expiration}
                    error={errors && errors.playback_expiration}
                    onChange={handleChange}
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
