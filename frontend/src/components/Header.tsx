import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background: #000000;
  padding: 1rem 2rem;
  border-bottom: 1px solid #333;
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Logo = styled.div`
  width: 40px;
  height: 40px;
  background: #ffffff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #000000;
`;

const LogoText = styled.h1`
  color: #ffffff;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  font-family: 'Times New Roman', serif;
`;

const NavLinks = styled.nav`
  display: flex;
  gap: 2rem;
  align-items: center;
`;

const NavLink = styled.a`
  color: #ffffff;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  font-family: 'Times New Roman', serif;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.3s ease;
  border: 1px solid transparent;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
  }

  &.active {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.4);
  }
`;

const Header: React.FC = () => {
  return (
    <HeaderContainer>
      <HeaderContent>
        <LogoContainer>
          <Logo>SP</Logo>
          <LogoText>SoftlyPlease Compute</LogoText>
        </LogoContainer>

        <NavLinks>
          <NavLink href="/">Home</NavLink>
          <NavLink href="/configurator">Configurator</NavLink>
          <NavLink href="/mcneel-compute-examples">McNeel Examples</NavLink>
          <NavLink href="/performance">Performance</NavLink>
          <NavLink href="/about">About</NavLink>
          <NavLink href="/contact">Contact</NavLink>
        </NavLinks>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;
