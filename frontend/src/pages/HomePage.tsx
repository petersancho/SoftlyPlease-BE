import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 2rem;
  text-align: center;
`;

const Title = styled.h1`
  color: #00ff88;
  margin-bottom: 1rem;
`;

const Description = styled.p`
  color: #ccc;
  font-size: 1.1rem;
`;

const HomePage: React.FC = () => {
  return (
    <Container>
      <Title>Welcome to SoftlyPlease Compute</Title>
      <Description>
        Enterprise-grade computational design platform with advanced 3D visualization.
      </Description>
    </Container>
  );
};

export default HomePage;
