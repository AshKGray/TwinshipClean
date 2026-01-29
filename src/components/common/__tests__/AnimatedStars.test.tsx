/**
 * AnimatedStars Component Tests
 *
 * Basic smoke tests - animation testing requires device/emulator
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import AnimatedStars from '../AnimatedStars';

describe('AnimatedStars', () => {
  it('renders without crashing', () => {
    const { getByTestID } = render(<AnimatedStars />);
    expect(getByTestID('animated-stars')).toBeTruthy();
  });

  it('has pointer events disabled', () => {
    const { getByTestID } = render(<AnimatedStars />);
    const container = getByTestID('animated-stars');

    expect(container.props.pointerEvents).toBe('none');
  });

  it('is a memoized component', () => {
    expect(AnimatedStars).toBeDefined();
    expect(typeof AnimatedStars).toBe('object'); // Memoized
  });
});
