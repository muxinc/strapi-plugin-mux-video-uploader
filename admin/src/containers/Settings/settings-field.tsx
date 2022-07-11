import React from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import Information from '@strapi/icons/Information';
import { Box } from '@strapi/design-system/Box';
import { Icon } from '@strapi/design-system/Icon';
import { Field, FieldError, FieldHint, FieldInput, FieldLabel } from '@strapi/design-system/Field';
import { Flex } from '@strapi/design-system/Flex';
import { Link } from '@strapi/design-system/Link';
import { Stack } from '@strapi/design-system/Stack';
import { Tooltip } from '@strapi/design-system/Tooltip';

import getTrad from '../../utils/getTrad';

interface Props {
  name: string;
  label?: string;
  value: string;
  isPassword?: boolean;
  placeholder?: string;
  description?: string;
  tooltip?: string;
  detailsLink?: string;
  error?: string
  onChange?: (e: React.ChangeEvent<any>) => void;
}

const FieldLabelStyled = styled(FieldLabel)`
  & > div {
    width: max-content;
  }
`;

const TooltipButtonStyled = styled.button`
  border: none;
  padding: 0;
  background: transparent;
`;

const SettingsField = (props: Props) => {
  const { name, label, value, isPassword, placeholder, description, tooltip, detailsLink, error, onChange = () => { } } = props;
  
  const { formatMessage } = useIntl();

  return (
    <Field name={name} hint={description} error={error}>
      <Stack spacing={1}>
        <Flex>
          <FieldLabelStyled>{label}</FieldLabelStyled>
          <Box paddingLeft={2}>
            {
              tooltip && (
                <Tooltip description={tooltip}>
                  <TooltipButtonStyled
                    type='button'
                    aria-label={formatMessage({ id: getTrad('SettingsField.tooltip-label'), defaultMessage: 'Information about the field' })}
                  >
                    <Icon as={Information} color="neutral800" aria-hidden={true} />
                  </TooltipButtonStyled>
                </Tooltip>
              )
            }
          </Box>
          {
            detailsLink && (
              <Flex width="100%" justifyContent="flex-end">
                <Link isExternal href={detailsLink}>
                  {formatMessage({ id: getTrad('SettingsField.details-label'), defaultMessage: 'Details' })}
                </Link>
              </Flex>
            )
          }
        </Flex>
        <FieldInput
          placeholder={placeholder}
          value={value}
          type={isPassword ? 'password' : 'text'}
          onChange={onChange}
        />
        <FieldHint />
        <FieldError />
      </Stack>
    </Field>
  );
};

export default SettingsField;
