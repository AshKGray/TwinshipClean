/**
 * Animation Presets and Configurations
 * Story 6.5: Smooth Page Transitions
 *
 * Reusable animation configurations for consistent timing and easing
 */

import { Easing } from 'react-native-reanimated';

/**
 * Animation duration presets
 */
export const ANIMATION_PRESETS = {
  quick: {
    duration: 200,
    easing: Easing.inOut(Easing.ease),
  },
  normal: {
    duration: 300,
    easing: Easing.inOut(Easing.ease),
  },
  slow: {
    duration: 500,
    easing: Easing.inOut(Easing.ease),
  },
  spring: {
    damping: 20,
    stiffness: 300,
    mass: 1,
  },
  bouncy: {
    damping: 10,
    stiffness: 200,
    mass: 1,
  },
};

/**
 * Easing curve presets
 */
export const EASING_CURVES = {
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
  linear: Easing.linear,
  elastic: Easing.elastic(1),
};
