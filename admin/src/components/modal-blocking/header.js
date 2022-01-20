const React, { PropsWithChildren } = require('react');
const styled = require('styled-components');
const { Flex } = require('@strapi/design-system/Flex');
const { Box } = require('@strapi/design-system/Box');

const ModalHeaderWrapper = styled(Box)`
  border-radius: ${({ theme }) => theme.borderRadius} ${({ theme }) => theme.borderRadius} 0 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral150};
`;

const ModalHeader = ({ children }) => {
  return (
    <ModalHeaderWrapper paddingTop={4} paddingBottom={4} paddingLeft={5} paddingRight={5} background="neutral100">
      <Flex justifyContent="space-between">
        {children}
      </Flex>
    </ModalHeaderWrapper>
  );
};

export default ModalHeader;
