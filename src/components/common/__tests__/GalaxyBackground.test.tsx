/**
 * GalaxyBackground Component Tests
 *
 * Basic smoke tests - full integration testing will be done in app
 */

import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import GalaxyBackground from '../GalaxyBackground';

// Mock useReducedMotion hook
jest.mock('../../../hooks/useReducedMotion', () => ({
  useReducedMotion: jest.fn(() => false),
}));

describe('GalaxyBackground', () => {
  it('renders without crashing', () => {
    const { getByTestID } = render(<GalaxyBackground />);
    expect(getByTestID('galaxy-background')).toBeTruthy();
  });

  it('renders children correctly', () => {
    const { getByText } = render(
      <GalaxyBackground>
        <Text>Test Content</Text>
      </GalaxyBackground>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('accepts custom testID', () => {
    const { getByTestID } = render(<GalaxyBackground testID="custom-bg" />);
    expect(getByTestID('custom-bg')).toBeTruthy();
  });

  it('renders background image', () => {
    const { getByTestID } = render(<GalaxyBackground />);
    const backgroundImage = getByTestID('galaxy-background-image');

    expect(backgroundImage).toBeTruthy();
  });

  it('is a valid React component', () => {
    expect(GalaxyBackground).toBeDefined();
    expect(typeof GalaxyBackground).toBe('object'); // Memoized component
  });
});
