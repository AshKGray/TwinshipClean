/**
 * SkeletonLoader Component
 * Story 6.6: Loading States and Skeleton Screens
 *
 * Provides elegant loading placeholders with shimmer effect
 * for different content types (text, card, image, list-item, custom).
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface SkeletonLoaderProps {
  /** Type of skeleton (predefined layouts) */
  type?: 'text' | 'card' | 'image' | 'list-item' | 'custom';
  /** Width (number in pixels or percentage string) */
  width?: number | string;
  /** Height (number in pixels or percentage string) */
  height?: number | string;
  /** Border radius in pixels */
  borderRadius?: number;
  /** Enable shimmer animation */
  shimmer?: boolean;
  /** Number of skeletons to render */
  count?: number;
  /** Additional styles */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'custom',
  width,
  height,
  borderRadius = 8,
  shimmer = true,
  count = 1,
  style,
  testID,
}) => {
  const reducedMotion = useReducedMotion();
  const translateX = useSharedValue(-1);

  useEffect(() => {
    if (shimmer && !reducedMotion) {
      translateX.value = withRepeat(
        withTiming(1, { duration: 1500 }),
        -1,
        false
      );
    }
  }, [shimmer, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateXValue = interpolate(
      translateX.value,
      [-1, 1],
      [-300, 300]
    );

    return {
      transform: [{ translateX: translateXValue }],
    };
  });

  const getDimensions = (): { width: number | string; height: number | string } => {
    switch (type) {
      case 'text':
        return { width: width || '80%', height: height || 16 };
      case 'card':
        return { width: width || '100%', height: height || 200 };
      case 'image':
        return { width: width || 100, height: height || 100 };
      case 'list-item':
        return { width: width || '100%', height: height || 60 };
      default:
        return { width: width || '100%', height: height || 20 };
    }
  };

  const dimensions = getDimensions();

  const renderSkeleton = (index: number) => (
    <View
      key={index}
      style={[
        styles.skeleton,
        {
          width: dimensions.width,
          height: dimensions.height,
          borderRadius,
          marginBottom: index < count - 1 ? 8 : 0,
        },
        style,
      ]}
      testID={testID ? `${testID}-${index}` : undefined}
    >
      {shimmer && !reducedMotion && (
        <Animated.View
          style={[
            styles.shimmerContainer,
            animatedStyle,
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0)',
              'rgba(255, 255, 255, 0.1)',
              'rgba(255, 255, 255, 0)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmer}
          />
        </Animated.View>
      )}
    </View>
  );

  return (
    <>
      {Array.from({ length: count }).map((_, index) => renderSkeleton(index))}
    </>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#374151', // nebula-mist
    overflow: 'hidden',
  },
  shimmerContainer: {
    width: '100%',
    height: '100%',
  },
  shimmer: {
    width: 300,
    height: '100%',
  },
});

export default React.memo(SkeletonLoader);
