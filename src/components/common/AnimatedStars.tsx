/**
 * AnimatedStars Component
 *
 * Renders subtly twinkling stars over the galaxy background.
 * Used sparingly for special screens (e.g., onboarding, game results).
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface StarProps {
  left: string;
  top: string;
  size: number;
}

/**
 * Individual animated star component
 */
const Star: React.FC<StarProps> = ({ left, top, size }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    // Random delay and duration for more natural twinkling
    const delay = Math.random() * 2000; // 0-2 seconds delay
    const duration = 1000 + Math.random() * 1000; // 1-2 seconds duration

    // Start twinkling after random delay
    const timeoutId = setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration }),
          withTiming(0.3, { duration })
        ),
        -1, // Infinite repeat
        false // Don't reverse
      );
    }, delay);

    return () => clearTimeout(timeoutId);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left,
          top,
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    />
  );
};

/**
 * AnimatedStars Component
 *
 * Renders a collection of randomly positioned, twinkling stars.
 * Performance-optimized with absolute positioning and minimal re-renders.
 */
const AnimatedStars: React.FC = () => {
  // Generate 12 stars with random positions and sizes
  const stars = React.useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 2 + 1, // 1-3px diameter
      })),
    []
  );

  return (
    <View
      style={styles.starsContainer}
      pointerEvents="none" // Don't interfere with touch events
      testID="animated-stars"
    >
      {stars.map(star => (
        <Star key={star.id} {...star} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1, // Above background, below content
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 999, // Fully circular
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 1,
  },
});

export default React.memo(AnimatedStars);
