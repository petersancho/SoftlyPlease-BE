import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  background: #1a1a1a;
  padding: 1rem 2rem;
  border-top: 1px solid #333;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
`;

const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <p>© 2024 SoftlyPlease Compute - Enterprise Performance Edition</p>
    </FooterContainer>
  );
};

export default Footer;
