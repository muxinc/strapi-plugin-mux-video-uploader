import React from 'react';
import { Button, Flex } from '@buffetjs/core';
import styled from 'styled-components';

import Logo from '../../components/logo';

const ContainerStyled = styled(Flex)`
  margin-bottom: 3rem;
`;

const TitleStyled = styled.h1`
  margin-left: 3rem;
`;

interface Props extends DefaultProps {
  disableSubmit: boolean;
}

interface DefaultProps {
  onSubmitClick: () => void;
}

const Header = (props:Props) => {
  return (<ContainerStyled justifyContent='space-between' alignItems='center'>
    <Flex alignItems='center'>
    <Logo />
    <TitleStyled>Video Uploader</TitleStyled>
    </Flex>
    <Button color="primary" label="Save" onClick={props.onSubmitClick} disabled={props.disableSubmit} />
  </ContainerStyled>);
};

Header.defaultProps = {
  onSubmitClick: () => {}
}

export default Header;
