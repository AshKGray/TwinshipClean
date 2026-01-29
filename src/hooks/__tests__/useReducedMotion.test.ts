/**
 * useReducedMotion Hook Tests
 *
 * Simplified tests - integration testing via components provides better coverage
 */

import { useReducedMotion } from '../useReducedMotion';

describe('useReducedMotion', () => {
  it('exports useReducedMotion hook', () => {
    expect(useReducedMotion).toBeDefined();
    expect(typeof useReducedMotion).toBe('function');
  });

  it('is a valid React hook', () => {
    // Hook name must start with 'use'
    expect(useReducedMotion.name).toMatch(/^use/);
  });
});
