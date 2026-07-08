/**
 * Cosmic Card Component
 *
 * Reusable card with galaxy styling, translucent backgrounds,
 * optional blur effects, and glow borders.
 *
 * Story: 6-4 Cosmic Card Component
 */

import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { ACCENT_COLORS, type GalaxyAccentColor } from '../../theme/colors';
import { ELEVATIONS } from '../../theme/shadows';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface CosmicCardProps {
  /** Elevation level for shadows (1=subtle, 2=medium, 3=prominent) */
  elevation?: 1 | 2 | 3;
  /** Enable blur effect background */
  blur?: boolean;
  /** Enable glow border with accent color */
  glowBorder?: boolean;
  /** Accent color for glow border */
  accentColor?: GalaxyAccentColor;
  /** Make card pressable */
  onPress?: () => void;
  /** Disable press interaction */
  disabled?: boolean;
  /** Border radius in pixels */
  borderRadius?: number;
  /** Padding in pixels */
  padding?: number;
  /** Background color (when blur is false) */
  backgroundColor?: string;
  /** Background opacity (0-1) */
  backgroundOpacity?: number;
  /** Optional header section */
  header?: React.ReactNode;
  /** Optional footer section */
  footer?: React.ReactNode;
  /** Card content */
  children: React.ReactNode;
  /** Test ID for testing */
  testID?: string;
  /** Additional styles */
  style?: ViewStyle;
}

const CosmicCard: React.FC<CosmicCardProps> = ({
  elevation = 1,
  blur = false,
  glowBorder = false,
  accentColor = 'stellar-blue',
  onPress,
  disabled = false,
  borderRadius = 16,
  padding = 16,
  backgroundColor = '#1a1a2e',
  backgroundOpacity = 0.8,
  header,
  footer,
  children,
  testID,
  style,
}) => {
  const scale = useSharedValue(1);
  const baseColor = ACCENT_COLORS[accentColor];

  const handlePressIn = () => {
    if (onPress && !disabled) {
      scale.value = withSpring(0.98, {
        damping: 15,
        stiffness: 300,
      });
    }
  };

  const handlePressOut = () => {
    if (onPress && !disabled) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const elevationStyle = ELEVATIONS[elevation];

  const borderStyle: ViewStyle = glowBorder
    ? {
        borderWidth: 1,
        borderColor: `${baseColor}66`, // 40% opacity
        shadowColor: baseColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 8 + elevation * 4,
      }
    : {};

  const CardContainer = onPress ? AnimatedPressable : View;

  const cardStyle: ViewStyle = {
    borderRadius,
    overflow: 'hidden',
    opacity: disabled ? 0.5 : 1,
    ...elevationStyle,
    ...borderStyle,
  };

  const content = (
    <View style={[styles.contentWrapper, { padding }]}>
      {header && <View style={styles.header}>{header}</View>}
      <View style={styles.content}>{children}</View>
      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );

  return (
    <CardContainer
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress || disabled}
      testID={testID}
      accessibilityRole={onPress ? 'button' : undefined}
      style={[cardStyle, style, onPress && animatedStyle]}
    >
      {blur ? (
        <BlurView
          intensity={80}
          tint="dark"
          style={styles.blurContainer}
          testID={`${testID}-blur`}
        >
          {content}
        </BlurView>
      ) : (
        <View
          style={[
            styles.solidBackground,
            {
              backgroundColor,
              opacity: backgroundOpacity,
            },
          ]}
          testID={`${testID}-solid`}
        >
          {content}
        </View>
      )}
    </CardContainer>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
  },
  solidBackground: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  header: {
    marginBottom: 12,
  },
  content: {
    flex: 1,
  },
  footer: {
    marginTop: 12,
  },
});

export default React.memo(CosmicCard);
