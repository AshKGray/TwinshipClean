/**
 * GalaxyBackground Component
 *
 * Provides a consistent cosmic background across all screens.
 * Supports different intensity levels and optional star animations.
 */

import React from 'react';
import { View, ImageBackground, StyleSheet } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { BASE_COLORS } from '@/theme';
import AnimatedStars from './AnimatedStars';

export interface GalaxyBackgroundProps {
  /**
   * Background intensity level
   * - subtle: 60% opacity (less distracting)
   * - normal: 80% opacity (default)
   * - vibrant: 100% opacity (full effect)
   */
  intensity?: 'subtle' | 'normal' | 'vibrant';

  /**
   * Enable animated twinkling stars
   * Automatically disabled if user has reduced motion enabled
   */
  animated?: boolean;

  /**
   * Content to render on top of the background
   */
  children?: React.ReactNode;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * GalaxyBackground Component
 *
 * A memoized, performance-optimized background component that provides
 * a consistent cosmic aesthetic across the app.
 *
 * @example
 * // Basic usage
 * <GalaxyBackground>
 *   <Text>Your content here</Text>
 * </GalaxyBackground>
 *
 * @example
 * // With animated stars
 * <GalaxyBackground intensity="vibrant" animated>
 *   <SafeAreaView style={{ flex: 1 }}>
 *     <OnboardingContent />
 *   </SafeAreaView>
 * </GalaxyBackground>
 *
 * @example
 * // Subtle background for text-heavy screens
 * <GalaxyBackground intensity="subtle">
 *   <ScrollView>
 *     <LongArticle />
 *   </ScrollView>
 * </GalaxyBackground>
 */
const GalaxyBackground: React.FC<GalaxyBackgroundProps> = ({
  intensity = 'normal',
  animated = false,
  children,
  testID = 'galaxy-background',
}) => {
  const reducedMotion = useReducedMotion();

  // Map intensity to opacity values
  const opacityMap: Record<NonNullable<GalaxyBackgroundProps['intensity']>, number> = {
    subtle: 0.6,
    normal: 0.8,
    vibrant: 1.0,
  };

  const opacity = opacityMap[intensity];

  // Disable animation if user prefers reduced motion
  const shouldAnimate = animated && !reducedMotion;

  return (
    <View style={styles.container} testID={testID}>
      {/* Galaxy background image */}
      <ImageBackground
        source={require('../../../assets/galaxybackground.png')}
        style={[styles.background, { opacity }]}
        resizeMode="cover"
        testID={`${testID}-image`}
      />

      {/* Optional animated stars */}
      {shouldAnimate && <AnimatedStars />}

      {/* Content overlay */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BASE_COLORS['cosmic-void'], // Fallback color
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    zIndex: 2, // Above background and stars
  },
});

/**
 * Memoized export to prevent unnecessary re-renders
 * Only re-renders if intensity or animated props change
 */
export default React.memo(GalaxyBackground);
