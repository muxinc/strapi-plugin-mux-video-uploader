import React from 'react';
import { Button, Flex, InputText } from '@buffetjs/core';
import { CheckPagePermissions, Label } from 'strapi-helper-plugin';
import styled from 'styled-components';

import Well from './../../components/well';
import { setMuxSettings } from '../../services/strapi';
import pluginPermissions from './../../permissions';

const ContainerStyled = styled.div`
  &> * {
    margin-bottom: 30px;
  }
`;

const H1Styled = styled.h1`
  margin: 5px 0 0 0;
`;

const SubHeadingStyled = styled.span`
  color: #787E8F;
  font-size: 1.3rem;
`;

const ButtonWrapperStyled = styled.div`
  &> * {
    margin-left: 15px;
  }
`;

const ShortRowStyled = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: 40% auto;
  grid-gap: 1rem;
  padding-bottom: 3rem;
`;

const LongRowStyled = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: 65% auto;
  grid-gap: 1rem;
  padding-bottom: 3rem;
`;

const Settings = () => {
  const [cancelDisabled, setCancelDisabled] = React.useState(true);
  const [accessToken, setAccesToken] = React.useState<string|undefined>();
  const [secretKey, setSecretKey] = React.useState<string|undefined>();
  const [webhookSigningSecret, setWebhookSigningSecret] = React.useState<string|undefined>();

  const onSaveClick = React.useCallback(async () => {
    const body = new FormData();

    if(accessToken !== undefined) {    
      body.append("access_token", accessToken);
    }
    
    if(secretKey !== undefined) {
      body.append("secret_key", secretKey);
    }
    
    if(webhookSigningSecret !== undefined) {
      body.append("webhook_signing_secret", webhookSigningSecret);
    }
    
    if(body.entries().next().done) {
      strapi.notification.info('No changes made');

      return;
    }

    const response = await setMuxSettings(body);

    if(response.status === 200) {
      strapi.notification.success('Changes saved');

      onCancelClick();
    } else {
      strapi.notification.error('Error while saving changes');
    }
  }, [accessToken, secretKey, webhookSigningSecret]);

  const onCancelClick = React.useCallback(() => {
    setAccesToken(undefined);
    setSecretKey(undefined);
    setWebhookSigningSecret(undefined);

    setCancelDisabled(true);
  }, []);

  return (
    <>
      <CheckPagePermissions 
        permissions={pluginPermissions.settings}
      >
        <ContainerStyled>
          <Flex alignItems='center' justifyContent='space-between'>
            <div>
              <H1Styled>Settings</H1Styled>
              <SubHeadingStyled>Mux Video Uploader</SubHeadingStyled>
            </div>
            <ButtonWrapperStyled>
              <Button color="cancel" label="Cancel" onClick={onCancelClick} disabled={cancelDisabled} />
              <Button color="success" label="Save" onClick={onSaveClick} />
            </ButtonWrapperStyled>
          </Flex>
          <Flex>
            <Well>
              <ShortRowStyled>
                <div>
                  <Label message='Access Token' />
                  <InputText
                    name="access_token"
                    onChange={({ target: { value } }: InputTextOnChange) => {
                      setAccesToken(value);
                      setCancelDisabled(false);
                    }}
                    type="password"
                    value={accessToken}
                  />
                </div>
              </ShortRowStyled>
              <LongRowStyled>
                <div>
                  <Label message='Secret Key' />
                  <InputText
                    name="secret_key"
                    onChange={({ target: { value } }: InputTextOnChange) => {
                      setSecretKey(value);
                      setCancelDisabled(false);
                    }}
                    type="password"
                    value={secretKey}
                  />
                </div>
              </LongRowStyled>
              <ShortRowStyled>
                <div>
                  <Label message='Webhook Signing Secret' />
                  <InputText
                    name="webhook_signing_secret"
                    onChange={({ target: { value } }: InputTextOnChange) => {
                      setWebhookSigningSecret(value);
                      setCancelDisabled(false);
                    }}
                    type="password"
                    value={webhookSigningSecret}
                  />
                </div>
              </ShortRowStyled>
            </Well>
          </Flex>
        </ContainerStyled>
      </CheckPagePermissions>
    </>
  );
};

export default Settings;
