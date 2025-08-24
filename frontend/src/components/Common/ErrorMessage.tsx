import React from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid #ff4444;
  border-radius: 8px;
  color: #ff6b6b;
  text-align: center;
`;

const ErrorTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #ff4444;
`;

const ErrorText = styled.p`
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
`;

const RetryButton = styled.button`
  background: #ff4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background: #ff6b6b;
  }
`;

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry
}) => {
  return (
    <ErrorContainer>
      <ErrorTitle>Error</ErrorTitle>
      <ErrorText>{message}</ErrorText>
      {onRetry && (
        <RetryButton onClick={onRetry}>
          Retry
        </RetryButton>
      )}
    </ErrorContainer>
  );
};

export default ErrorMessage;
