import React from 'react';
import styled from 'styled-components';

const ContainerStyled = styled.div`
  width: 100%;
  padding: 22px 25px 0 25px;
  background: #ffffff;
  border-radius: 2px;
  box-shadow: 0 2px 4px #e3e9f3;
  margin-bottom: 17px;
`;

const Well = (props) => {
  return <ContainerStyled>{props.children}</ContainerStyled>
};

export default React.memo(Well);
