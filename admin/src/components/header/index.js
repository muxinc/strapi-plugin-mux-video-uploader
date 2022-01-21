const React = require('react');
const { Flex } = require('@buffetjs/core');
const styled = require('styled-components');

const Logo = require('../../components/logo');

const ContainerStyled = styled(Flex)`
  margin-bottom: 3rem;
`;

const TitleStyled = styled.h1`
  margin-left: 3rem;
`;

const Header = () => {
  return (
    <ContainerStyled justifyContent='space-between' alignItems='center'>
      <Flex alignItems='center'>
        <Logo />
        <TitleStyled>Video Uploader</TitleStyled>
      </Flex>
    </ContainerStyled>
  );
};

module.exports = Header;
