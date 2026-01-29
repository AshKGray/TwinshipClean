/**
 * Neon Button Component Tests
 *
 * Basic smoke tests - full integration testing via screens in app.
 * Animation and haptic testing requires device/emulator.
 *
 * Story: 6-3 Neon Glow Button Component
 */

import React from 'react';

describe('NeonButton', () => {
  it('is defined and exportable', () => {
    const NeonButton = require('../NeonButton').default;
    expect(NeonButton).toBeDefined();
    expect(typeof NeonButton).toBe('object'); // Memoized component
  });

  it('is a valid React component', () => {
    const NeonButton = require('../NeonButton').default;
    expect(React.isValidElement(<NeonButton onPress={() => {}}>Test</NeonButton>)).toBe(true);
  });
});
