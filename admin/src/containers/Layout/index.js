
const React = require('react');
const styled = require('styled-components');

const Header = require('../../components/header');

const ContainerStyled = styled.div`
  padding: 3.1rem 2.5rem;
`;

const Layout = (props) => {
  return (
    <ContainerStyled>
      <Header />
      {props.children}
    </ContainerStyled>
  );
};

export default Layout;
