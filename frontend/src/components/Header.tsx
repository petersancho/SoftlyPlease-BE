import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background: #1a1a1a;
  padding: 1rem 2rem;
  border-bottom: 1px solid #333;
`;

const HeaderTitle = styled.h1`
  color: #00ff88;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const Header: React.FC = () => {
  return (
    <HeaderContainer>
      <HeaderTitle>SoftlyPlease Compute</HeaderTitle>
    </HeaderContainer>
  );
};

export default Header;
