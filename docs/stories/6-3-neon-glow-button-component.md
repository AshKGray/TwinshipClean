# Story 6.3: Neon Glow Button Component

**Epic**: Epic 6 - Galaxy Visual Design System
**Story ID**: 6.3
**Status**: Drafted
**Effort**: Small (3-4 hours)
**Dependencies**: Story 6.1 (Color System)

---

## User Story

**As a** user
**I want** interactive buttons with neon glow effects
**So that** the UI feels magical, responsive, and satisfying to use

---

## Acceptance Criteria

1. **Component Variants**
   - Create `NeonButton` component with 4 variants: primary, secondary, outline, ghost
   - 3 size options: small, medium, large
   - Each variant has distinct visual style

2. **Glow Effect**
   - Neon glow effect using shadows/glow CSS
   - Glow intensifies on press (React Native Reanimated)
   - Press animation completes in 200ms
   - Release animation returns to normal in 200ms

3. **Haptic Feedback**
   - Haptic feedback triggers on press (expo-haptics)
   - Customizable haptic pattern via prop
   - Default to 'medium' impact
   - Gracefully handles devices without haptics

4. **States**
   - Loading state with animated spinner
   - Disabled state with reduced opacity (50%)
   - Active/pressed state with visual feedback
   - Default state with base glow

5. **Accessibility**
   - Minimum 44x44 point touch target (iOS HIG)
   - Screen reader accessible with proper labels
   - Supports custom accessibilityLabel
   - Focus indicators for keyboard navigation

6. **Customization**
   - Accepts custom accent color prop
   - Optional icon support (left or right)
   - Full width option
   - Custom onPress handler

7. **TypeScript**
   - Fully typed component interface
   - No TypeScript errors
   - Proper prop validation

---

## Implementation Details

### Files to Create/Modify

**New Files:**
- `src/components/common/NeonButton.tsx` - Main component
- `src/components/common/NeonButton.test.tsx` - Tests
- `src/components/common/ButtonSpinner.tsx` - Loading spinner

**Modified Files:**
- `src/components/common/index.ts` - Export NeonButton

### Component Interface

```typescript
interface NeonButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'small' | 'medium' | 'large';
  accentColor?: GalaxyAccentColor;
  onPress: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  hapticFeedback?: HapticPattern;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  children: React.ReactNode;
}
```

### Component Structure

```tsx
import React, { useState } from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { triggerHaptic } from '@/theme/haptics';
import { getAccentColor } from '@/theme/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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

  const colorScheme = getAccentColor(accentColor);

  const handlePress = async () => {
    if (disabled || loading || isProcessing) return;

    // Trigger haptic feedback
    triggerHaptic(hapticFeedback);

    // Handle async onPress
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

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colorScheme.base,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: colorScheme.dark,
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colorScheme.base,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
    }
  };

  const getSizeStyles = () => {
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

  const isDisabled = disabled || loading || isProcessing;

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
          shadowColor: colorScheme.base,
          opacity: isDisabled ? 0.5 : 1,
          width: fullWidth ? '100%' : 'auto',
        },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        {loading || isProcessing ? (
          <ActivityIndicator
            color={variant === 'primary' ? '#FFFFFF' : colorScheme.base}
            size={size === 'small' ? 'small' : 'large'}
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <View style={styles.iconLeft}>{icon}</View>
            )}
            <Text
              style={[
                styles.text,
                {
                  color: variant === 'primary' ? '#FFFFFF' : colorScheme.base,
                  fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
                  fontWeight: '600',
                },
              ]}
            >
              {children}
            </Text>
            {icon && iconPosition === 'right' && (
              <View style={styles.iconRight}>{icon}</View>
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

export default NeonButton;
```

---

## Technical Approach

### 1. Glow Animation

```typescript
// Glow intensifies on press
const handlePressIn = () => {
  glowIntensity.value = withTiming(1.5, {
    duration: 200,
    easing: Easing.inOut(Easing.ease),
  });
};

// Returns to normal on release
const handlePressOut = () => {
  glowIntensity.value = withSpring(1, {
    damping: 15,
    stiffness: 300,
  });
};

// Apply to shadow style
const animatedStyle = useAnimatedStyle(() => ({
  shadowOpacity: 0.6 * glowIntensity.value,
  shadowRadius: 10 * glowIntensity.value,
}));
```

### 2. Haptic Integration

```typescript
import { triggerHaptic } from '@/theme/haptics';

const handlePress = async () => {
  // Trigger haptic immediately for best UX
  triggerHaptic(hapticFeedback);

  // Then execute onPress handler
  const result = onPress();
  if (result instanceof Promise) {
    setIsProcessing(true);
    await result;
    setIsProcessing(false);
  }
};
```

### 3. Async onPress Handling

```typescript
// Support both sync and async onPress
const [isProcessing, setIsProcessing] = useState(false);

const handlePress = async () => {
  const result = onPress();

  // If async, show loading state
  if (result instanceof Promise) {
    setIsProcessing(true);
    try {
      await result;
    } finally {
      setIsProcessing(false);
    }
  }
};

// Combine loading states
const isDisabled = disabled || loading || isProcessing;
```

---

## Testing Requirements

### Unit Tests

**File**: `src/components/common/__tests__/NeonButton.test.tsx`

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import NeonButton from '../NeonButton';
import * as haptics from '@/theme/haptics';

jest.mock('@/theme/haptics');

describe('NeonButton', () => {
  it('renders with default props', () => {
    const { getByText } = render(
      <NeonButton variant="primary" size="medium" onPress={() => {}}>
        Click Me
      </NeonButton>
    );
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <NeonButton variant="primary" size="medium" onPress={onPress}>
        Click Me
      </NeonButton>
    );

    fireEvent.press(getByText('Click Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('triggers haptic feedback on press', () => {
    const triggerHapticSpy = jest.spyOn(haptics, 'triggerHaptic');
    const { getByText } = render(
      <NeonButton variant="primary" size="medium" onPress={() => {}}>
        Click Me
      </NeonButton>
    );

    fireEvent.press(getByText('Click Me'));
    expect(triggerHapticSpy).toHaveBeenCalledWith('medium');
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <NeonButton
        variant="primary"
        size="medium"
        onPress={onPress}
        disabled
      >
        Click Me
      </NeonButton>
    );

    fireEvent.press(getByText('Click Me'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading spinner when loading=true', () => {
    const { getByTestID, queryByText } = render(
      <NeonButton
        variant="primary"
        size="medium"
        onPress={() => {}}
        loading
        testID="button"
      >
        Click Me
      </NeonButton>
    );

    expect(queryByText('Click Me')).toBeNull();
    // ActivityIndicator should be present
  });

  it('handles async onPress correctly', async () => {
    const asyncPress = jest.fn(() => Promise.resolve());
    const { getByText } = render(
      <NeonButton variant="primary" size="medium" onPress={asyncPress}>
        Click Me
      </NeonButton>
    );

    fireEvent.press(getByText('Click Me'));
    expect(asyncPress).toHaveBeenCalled();
    // Should show loading state during async operation
  });

  describe('variants', () => {
    it('renders primary variant correctly', () => {
      const { getByTestID } = render(
        <NeonButton
          variant="primary"
          size="medium"
          onPress={() => {}}
          testID="button"
        >
          Primary
        </NeonButton>
      );
      const button = getByTestID('button');
      // Check background color
    });

    it('renders outline variant correctly', () => {
      const { getByTestID } = render(
        <NeonButton
          variant="outline"
          size="medium"
          onPress={() => {}}
          testID="button"
        >
          Outline
        </NeonButton>
      );
      const button = getByTestID('button');
      // Check border width
    });
  });

  describe('sizes', () => {
    it('renders small size with correct dimensions', () => {
      const { getByTestID } = render(
        <NeonButton
          variant="primary"
          size="small"
          onPress={() => {}}
          testID="button"
        >
          Small
        </NeonButton>
      );
      // Check minHeight: 36
    });

    it('renders large size with correct dimensions', () => {
      const { getByTestID } = render(
        <NeonButton
          variant="primary"
          size="large"
          onPress={() => {}}
          testID="button"
        >
          Large
        </NeonButton>
      );
      // Check minHeight: 52
    });
  });

  describe('accessibility', () => {
    it('has minimum 44x44 touch target', () => {
      const { getByTestID } = render(
        <NeonButton
          variant="primary"
          size="medium"
          onPress={() => {}}
          testID="button"
        >
          Click
        </NeonButton>
      );
      const button = getByTestID('button');
      expect(button.props.style.minHeight).toBeGreaterThanOrEqual(44);
    });

    it('sets accessibilityLabel correctly', () => {
      const { getByLabelText } = render(
        <NeonButton
          variant="primary"
          size="medium"
          onPress={() => {}}
          accessibilityLabel="Custom Label"
        >
          Click
        </NeonButton>
      );
      expect(getByLabelText('Custom Label')).toBeTruthy();
    });

    it('sets disabled accessibility state', () => {
      const { getByTestID } = render(
        <NeonButton
          variant="primary"
          size="medium"
          onPress={() => {}}
          disabled
          testID="button"
        >
          Click
        </NeonButton>
      );
      const button = getByTestID('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('icon support', () => {
    it('renders icon on left', () => {
      const Icon = () => <View testID="icon" />;
      const { getByTestID } = render(
        <NeonButton
          variant="primary"
          size="medium"
          onPress={() => {}}
          icon={<Icon />}
          iconPosition="left"
        >
          With Icon
        </NeonButton>
      );
      expect(getByTestID('icon')).toBeTruthy();
    });

    it('renders icon on right', () => {
      const Icon = () => <View testID="icon" />;
      const { getByTestID } = render(
        <NeonButton
          variant="primary"
          size="medium"
          onPress={() => {}}
          icon={<Icon />}
          iconPosition="right"
        >
          With Icon
        </NeonButton>
      );
      expect(getByTestID('icon')).toBeTruthy();
    });
  });
});
```

### Animation Tests

```typescript
describe('NeonButton Animations', () => {
  it('animates glow on press', () => {
    const { getByTestID } = render(
      <NeonButton
        variant="primary"
        size="medium"
        onPress={() => {}}
        testID="button"
      >
        Animate
      </NeonButton>
    );

    const button = getByTestID('button');

    // Simulate press in
    fireEvent(button, 'pressIn');
    // Check shadowRadius increases

    // Simulate press out
    fireEvent(button, 'pressOut');
    // Check shadowRadius returns to normal
  });
});
```

---

## Definition of Done

- [ ] `NeonButton` component created with full TypeScript types
- [ ] All 4 variants (primary, secondary, outline, ghost) implemented
- [ ] All 3 sizes (small, medium, large) implemented
- [ ] Glow animation on press using Reanimated
- [ ] Haptic feedback integration
- [ ] Loading and disabled states working correctly
- [ ] Icon support (left and right positions)
- [ ] Async onPress handling
- [ ] Unit tests written and passing (80%+ coverage)
- [ ] Accessibility requirements met (44x44 touch target, labels)
- [ ] Component exported from common/index.ts
- [ ] Used in at least 3 screens to validate behavior
- [ ] Code reviewed and approved
- [ ] TypeScript compiles with no errors
- [ ] Documentation added with usage examples

---

## Related Stories

- **Depends On**: 6.1 (Color System for accent colors), 6.7 (Haptics)
- **Blocks**: All screen implementations needing interactive buttons
- **Related**: 6.4 (Cosmic Card uses similar glow effects)

---

## Notes

- Button glow should be subtle in default state, more pronounced on press
- Haptic feedback makes interactions feel more tactile and premium
- Async onPress handling prevents double-taps and provides loading feedback
- Consider providing button presets for common actions (e.g., "Continue", "Back")
- Icon support enables buttons with visual indicators (arrows, checkmarks, etc.)
- Full width option useful for mobile layouts
- Ghost variant useful for tertiary actions or cancel buttons

---

**Created**: 2025-11-18
**Author**: Claude (BMAD Method)
**Status**: Drafted
