/**
 * CosmicSpinner Component
 * Story 6.6: Loading States and Skeleton Screens
 *
 * Rotating galaxy-themed loading spinner with gradient colors.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { getAccentColor, type GalaxyAccentColor } from '@/theme';

export interface CosmicSpinnerProps {
  /** Spinner size */
  size?: 'small' | 'medium' | 'large';
  /** Accent color for gradient */
  accentColor?: GalaxyAccentColor;
  /** Test ID for testing */
  testID?: string;
}

const CosmicSpinner: React.FC<CosmicSpinnerProps> = ({
  size = 'medium',
  accentColor = 'stellar-blue',
  testID,
}) => {
  const rotation = useSharedValue(0);
  const colorScheme = getAccentColor(accentColor);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 24, height: 24 };
      case 'medium':
        return { width: 40, height: 40 };
      case 'large':
        return { width: 60, height: 60 };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={styles.container} testID={testID}>
      <Animated.View style={[sizeStyles, animatedStyle]}>
        <LinearGradient
          colors={[colorScheme.base, colorScheme.light, colorScheme.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.spinner, sizeStyles]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    borderRadius: 999,
    opacity: 0.8,
  },
});

export default CosmicSpinner;
