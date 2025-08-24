import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 2rem;
  text-align: center;
`;

const ExamplesPage: React.FC = () => {
  return (
    <Container>
      <h1>Examples Page</h1>
      <p>Computational design examples coming soon...</p>
    </Container>
  );
};

export default ExamplesPage;
