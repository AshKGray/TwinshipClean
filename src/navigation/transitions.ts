/**
 * Navigation Transitions
 * Story 6.5: Smooth Page Transitions and Animations
 *
 * Custom transitions for React Navigation screens
 */

import { StackNavigationOptions } from '@react-navigation/stack';
import { Easing } from 'react-native-reanimated';

export const TRANSITIONS = {
  /**
   * Fade transition - smooth opacity change
   * Duration: 300ms
   */
  fade: (): StackNavigationOptions => ({
    cardStyleInterpolator: ({ current }) => ({
      cardStyle: {
        opacity: current.progress,
      },
    }),
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        },
      },
    },
  }),

  /**
   * Slide from right - default navigation feel
   */
  slideFromRight: (): StackNavigationOptions => ({
    cardStyleInterpolator: ({ current, layouts }) => ({
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
        ],
      },
    }),
    transitionSpec: {
      open: {
        animation: 'spring',
        config: {
          stiffness: 300,
          damping: 30,
          mass: 1,
        },
      },
      close: {
        animation: 'spring',
        config: {
          stiffness: 300,
          damping: 30,
          mass: 1,
        },
      },
    },
  }),

  /**
   * Slide from bottom - modal feel
   */
  slideFromBottom: (): StackNavigationOptions => ({
    cardStyleInterpolator: ({ current, layouts }) => ({
      cardStyle: {
        transform: [
          {
            translateY: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.height, 0],
            }),
          },
        ],
      },
    }),
    transitionSpec: {
      open: {
        animation: 'spring',
        config: {
          stiffness: 300,
          damping: 30,
          mass: 1,
        },
      },
      close: {
        animation: 'spring',
        config: {
          stiffness: 300,
          damping: 30,
          mass: 1,
        },
      },
    },
  }),

  /**
   * Scale transition - zoom in/out effect
   */
  scale: (): StackNavigationOptions => ({
    cardStyleInterpolator: ({ current }) => ({
      cardStyle: {
        opacity: current.progress,
        transform: [
          {
            scale: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1],
            }),
          },
        ],
      },
    }),
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: 300,
          easing: Easing.out(Easing.ease),
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 200,
          easing: Easing.in(Easing.ease),
        },
      },
    },
  }),
};

/**
 * Helper to create custom transition
 */
export function createTransition(
  type: 'fade' | 'slide' | 'scale',
  duration: number = 300
): StackNavigationOptions {
  const baseTransitions = {
    fade: TRANSITIONS.fade(),
    slide: TRANSITIONS.slideFromRight(),
    scale: TRANSITIONS.scale(),
  };

  return baseTransitions[type];
}
