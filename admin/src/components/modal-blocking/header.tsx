import React, { PropsWithChildren } from 'react';
import styled from 'styled-components';
import { Flex } from '@strapi/design-system/Flex';
import { Box } from '@strapi/design-system/Box';

const ModalHeaderWrapper = styled(Box)`
  border-radius: ${({ theme }) => theme.borderRadius} ${({ theme }) => theme.borderRadius} 0 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral150};
`;

type Props = {};

const ModalHeader = ({ children }:PropsWithChildren<Props>) => {
  return (
    <ModalHeaderWrapper paddingTop={4} paddingBottom={4} paddingLeft={5} paddingRight={5} background="neutral100">
      <Flex justifyContent="space-between">
        {children}
      </Flex>
    </ModalHeaderWrapper>
  );
};

export default ModalHeader;
