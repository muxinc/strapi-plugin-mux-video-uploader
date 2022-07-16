import React, { PropsWithChildren } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import Trash from '@strapi/icons/Trash';
import { Box } from '@strapi/design-system/Box';
import { Flex } from '@strapi/design-system/Flex';
import { IconButton } from '@strapi/design-system/IconButton';

import getTrad from '../../utils/getTrad';

const ActionBoxStyled = styled(Box)`
  height: ${52 / 16}rem;

  & > div {
    height: 100%;
  }
`;

interface Props {
  disableDelete?: boolean;
  onDelete?: () => void;
}

const PlayerWrapper = (props:PropsWithChildren<Props>) => {
  const { children, disableDelete = false, onDelete = () => { } } = props;
  
  const { formatMessage } = useIntl();

  return (
    <Box background="neutral150" borderColor="neutral200" hasRadius>
      <ActionBoxStyled paddingLeft={2} paddingRight={2}>
        <Flex justifyContent="end">
          <IconButton
            label={formatMessage({ id: getTrad('Common.delete-button'), defaultMessage: 'Delete' })}
            disableDelete={disableDelete}
            onClick={onDelete}
          icon={<Trash />}
          />
        </Flex>
      </ActionBoxStyled>
      {children}
      <ActionBoxStyled paddingLeft={2} paddingRight={2} />
    </Box>
  );
};

export default PlayerWrapper;
