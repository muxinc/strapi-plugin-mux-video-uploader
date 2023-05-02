import React from 'react';
import styled from 'styled-components';
import { setHexOpacity, useLockScroll } from '@strapi/helper-plugin';
import { Flex } from '@strapi/design-system/Flex';
import { FocusTrap } from '@strapi/design-system/FocusTrap';
import { Portal } from '@strapi/design-system/Portal';

const ModalWrapper = styled.div`
  position: absolute;
  z-index: 3;
  inset: 0;
  background: ${({ theme }) => setHexOpacity(theme.colors.neutral800, 0.2)};
  padding: 0 ${({ theme }) => theme.spaces[8]};
`;

const ModalContainer = styled(Flex)`
  position: relative;
  max-width: ${830 / 16}rem;
  border-radius: 4px;
  box-shadow: ${({ theme }) => setHexOpacity(theme.colors.neutral900, 0.1)} 0px 2px 15px;
  margin: 0 auto;
  overflow: hidden;
  margin-top: 10%;
  background-color: ${({ theme }) => theme.colors.neutral0};
  flex-direction: column;

  & > * {
    width: 100%;
  }
`;

interface Props {
  onClose?: () => void;
  isOpen: boolean;
}

const ModalBlocking = ({ children, onClose, isOpen }: React.PropsWithChildren<Props>) => {
  useLockScroll(isOpen);

  if (!isOpen) return null;

  return (
    <Portal>
      <ModalWrapper>
        <FocusTrap onEscape={() => {}}>
          <ModalContainer>{children}</ModalContainer>
        </FocusTrap>
      </ModalWrapper>
    </Portal>
  );
};

export default ModalBlocking;
