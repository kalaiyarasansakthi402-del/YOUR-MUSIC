import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

const ProblemChild: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test crash in child component');
  }
  return <Text>Normal Child Working</Text>;
};

describe('ErrorBoundary Crash Recovery Suite', () => {
  // Suppress error log output during intentional boundary throw
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalConsoleError;
  });

  it('renders children correctly when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(getByText('Normal Child Working')).toBeTruthy();
  });

  it('catches render crashes and displays safe fallback UI without crashing app', () => {
    const { getByText, getByTestId } = render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong.')).toBeTruthy();
    expect(getByTestId('error-boundary-retry-button')).toBeTruthy();
    expect(getByTestId('error-boundary-home-button')).toBeTruthy();
  });

  it('allows user to recover via Try Again button', () => {
    const onResetMock = jest.fn();
    const { getByTestId } = render(
      <ErrorBoundary onReset={onResetMock}>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryBtn = getByTestId('error-boundary-retry-button');
    fireEvent.press(retryBtn);
    expect(onResetMock).toHaveBeenCalledTimes(1);
  });
});
