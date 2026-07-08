/**
 * Neon Glow Button Component
 *
 * Interactive button with neon glow effects, haptic feedback, and animations.
 * Supports multiple variants, sizes, loading states, and async operations.
 *
 * Story: 6-3 Neon Glow Button Component
 */

import React, { useState } from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { triggerHaptic, type HapticPattern } from '../../theme/haptics';
import { ACCENT_COLORS, type GalaxyAccentColor } from '../../theme/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface NeonButtonProps {
  /** Button variant style */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Accent color from galaxy theme */
  accentColor?: GalaxyAccentColor;
  /** Press handler - can be sync or async */
  onPress: () => void | Promise<void>;
  /** Show loading spinner */
  loading?: boolean;
  /** Disable button interaction */
  disabled?: boolean;
  /** Optional icon (left or right of text) */
  icon?: React.ReactNode;
  /** Icon position */
  iconPosition?: 'left' | 'right';
  /** Haptic feedback pattern */
  hapticFeedback?: HapticPattern;
  /** Make button full width */
  fullWidth?: boolean;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Test ID for testing */
  testID?: string;
  /** Button text/content */
  children: React.ReactNode;
}

const NeonButton: React.FC<NeonButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  accentColor = 'stellar-blue',
  onPress,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  hapticFeedback = 'medium',
  fullWidth = false,
  accessibilityLabel,
  testID,
  children,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const glowIntensity = useSharedValue(1);

  const baseColor = ACCENT_COLORS[accentColor];

  const handlePress = async () => {
    if (disabled || loading || isProcessing) return;

    // Trigger haptic feedback immediately for best UX
    triggerHaptic(hapticFeedback);

    // Handle sync or async onPress
    const result = onPress();
    if (result instanceof Promise) {
      setIsProcessing(true);
      try {
        await result;
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handlePressIn = () => {
    glowIntensity.value = withTiming(1.5, { duration: 200 });
  };

  const handlePressOut = () => {
    glowIntensity.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    const shadowOpacity = 0.6 * glowIntensity.value;
    const shadowRadius = 10 * glowIntensity.value;

    return {
      shadowOpacity,
      shadowRadius,
    };
  });

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: baseColor,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: `${baseColor}33`, // 20% opacity
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: baseColor,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          minHeight: 36,
        };
      case 'medium':
        return {
          paddingVertical: 12,
          paddingHorizontal: 24,
          minHeight: 44,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 32,
          minHeight: 52,
        };
    }
  };

  const getTextColor = (): string => {
    if (variant === 'primary') {
      return '#FFFFFF';
    }
    return baseColor;
  };

  const getTextSize = (): number => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };

  const isDisabled = disabled || loading || isProcessing;
  const showSpinner = loading || isProcessing;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || String(children)}
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
      style={[
        styles.button,
        getVariantStyles(),
        getSizeStyles(),
        {
          shadowColor: baseColor,
          opacity: isDisabled ? 0.5 : 1,
          width: fullWidth ? '100%' : 'auto',
        },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        {showSpinner ? (
          <ActivityIndicator
            color={getTextColor()}
            size={size === 'small' ? 'small' : 'large'}
            testID={`${testID}-spinner`}
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <View style={styles.iconLeft} testID={`${testID}-icon-left`}>
                {icon}
              </View>
            )}
            <Text
              style={[
                styles.text,
                {
                  color: getTextColor(),
                  fontSize: getTextSize(),
                  fontWeight: '600',
                } as TextStyle,
              ]}
            >
              {children}
            </Text>
            {icon && iconPosition === 'right' && (
              <View style={styles.iconRight} testID={`${testID}-icon-right`}>
                {icon}
              </View>
            )}
          </>
        )}
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default React.memo(NeonButton);
