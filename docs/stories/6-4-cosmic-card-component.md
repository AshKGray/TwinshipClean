# Story 6.4: Cosmic Card Component

**Epic**: Epic 6 - Galaxy Visual Design System
**Story ID**: 6.4
**Status**: Drafted
**Effort**: Medium (4-5 hours)
**Dependencies**: Story 6.1 (Color System)

---

## User Story

**As a** developer
**I want** a reusable card component with galaxy styling
**So that** content is consistently presented across the app with cosmic aesthetics

---

## Acceptance Criteria

1. **Component Structure**
   - Create `CosmicCard` component with translucent background
   - Support header, content (children), and footer sections
   - Nested card support (card within card)
   - TypeScript fully typed interface

2. **Visual Design**
   - Translucent dark background with opacity
   - Optional backdrop blur effect (expo-blur)
   - Optional glow border with accent color
   - 3 elevation levels (1, 2, 3) with increasing shadow/glow

3. **Interaction**
   - Pressable variant for navigation cards
   - onPress handler support
   - Press animation (subtle scale effect)
   - Disabled state with reduced opacity

4. **Customization**
   - Custom accent color for glow border
   - Custom background opacity
   - Border radius customization
   - Padding customization

5. **Performance**
   - Component renders in < 100ms
   - Memoized to prevent unnecessary re-renders
   - Blur effect performant on scroll

6. **Accessibility**
   - Pressable cards have proper accessibility role
   - Focus indicators for keyboard navigation
   - Sufficient contrast between card and background

---

## Implementation Details

### Files to Create/Modify

**New Files:**
- `src/components/common/CosmicCard.tsx` - Main component
- `src/components/common/CosmicCard.test.tsx` - Tests

**Modified Files:**
- `src/components/common/index.ts` - Export CosmicCard

### Component Interface

```typescript
interface CosmicCardProps {
  elevation?: 1 | 2 | 3;
  blur?: boolean;
  glowBorder?: boolean;
  accentColor?: GalaxyAccentColor;
  onPress?: () => void;
  disabled?: boolean;
  borderRadius?: number;
  padding?: number;
  backgroundColor?: string;
  backgroundOpacity?: number;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  testID?: string;
  style?: ViewStyle;
}
```

### Component Structure

```tsx
import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { getAccentColor } from '@/theme/colors';
import { ELEVATIONS } from '@/theme/shadows';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  const colorScheme = getAccentColor(accentColor);

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, {
        damping: 15,
        stiffness: 300,
      });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
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

  const borderStyle = glowBorder
    ? {
        borderWidth: 1,
        borderColor: colorScheme.glow,
        shadowColor: colorScheme.base,
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
```

### Elevation/Shadow Definitions

```typescript
// src/theme/shadows.ts
export const ELEVATIONS = {
  1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};
```

---

## Technical Approach

### 1. Blur vs Solid Background

```typescript
// Conditional rendering based on blur prop
{blur ? (
  <BlurView intensity={80} tint="dark">
    {content}
  </BlurView>
) : (
  <View style={{ backgroundColor, opacity: backgroundOpacity }}>
    {content}
  </View>
)}
```

### 2. Nested Card Support

```typescript
// Cards can be nested by using the same component
<CosmicCard elevation={2}>
  <Text>Outer Card</Text>

  <CosmicCard elevation={1} style={{ marginTop: 16 }}>
    <Text>Nested Card</Text>
  </CosmicCard>
</CosmicCard>
```

### 3. Glow Border Effect

```typescript
const borderStyle = glowBorder
  ? {
      borderWidth: 1,
      borderColor: colorScheme.glow,
      shadowColor: colorScheme.base,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 8 + elevation * 4, // Scales with elevation
    }
  : {};
```

---

## Testing Requirements

### Unit Tests

```typescript
describe('CosmicCard', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <CosmicCard>
        <Text>Card Content</Text>
      </CosmicCard>
    );
    expect(getByText('Card Content')).toBeTruthy();
  });

  it('renders header and footer sections', () => {
    const { getByText } = render(
      <CosmicCard
        header={<Text>Header</Text>}
        footer={<Text>Footer</Text>}
      >
        <Text>Content</Text>
      </CosmicCard>
    );
    expect(getByText('Header')).toBeTruthy();
    expect(getByText('Content')).toBeTruthy();
    expect(getByText('Footer')).toBeTruthy();
  });

  it('applies elevation correctly', () => {
    const { getByTestID } = render(
      <CosmicCard elevation={3} testID="card">
        <Text>Content</Text>
      </CosmicCard>
    );
    const card = getByTestID('card');
    expect(card.props.style).toMatchObject(ELEVATIONS[3]);
  });

  it('renders with blur effect', () => {
    const { getByTestID } = render(
      <CosmicCard blur testID="card">
        <Text>Content</Text>
      </CosmicCard>
    );
    // BlurView should be present
  });

  it('renders glow border when enabled', () => {
    const { getByTestID } = render(
      <CosmicCard glowBorder accentColor="stellar-blue" testID="card">
        <Text>Content</Text>
      </CosmicCard>
    );
    const card = getByTestID('card');
    expect(card.props.style.borderWidth).toBe(1);
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestID } = render(
      <CosmicCard onPress={onPress} testID="card">
        <Text>Pressable</Text>
      </CosmicCard>
    );
    fireEvent.press(getByTestID('card'));
    expect(onPress).toHaveBeenCalled();
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByTestID } = render(
      <CosmicCard onPress={onPress} disabled testID="card">
        <Text>Disabled</Text>
      </CosmicCard>
    );
    fireEvent.press(getByTestID('card'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('supports nested cards', () => {
    const { getByText } = render(
      <CosmicCard>
        <Text>Outer</Text>
        <CosmicCard>
          <Text>Inner</Text>
        </CosmicCard>
      </CosmicCard>
    );
    expect(getByText('Outer')).toBeTruthy();
    expect(getByText('Inner')).toBeTruthy();
  });

  it('is memoized to prevent unnecessary re-renders', () => {
    const { rerender } = render(
      <CosmicCard>
        <Text>Content</Text>
      </CosmicCard>
    );

    // Re-render with same props
    rerender(
      <CosmicCard>
        <Text>Content</Text>
      </CosmicCard>
    );

    // Should not re-render (memoization working)
  });
});
```

### Performance Tests

```typescript
describe('CosmicCard Performance', () => {
  it('renders in under 100ms', () => {
    const startTime = performance.now();
    render(
      <CosmicCard>
        <Text>Content</Text>
      </CosmicCard>
    );
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(100);
  });

  it('blur effect does not impact scroll performance', async () => {
    const { getByTestID } = render(
      <ScrollView testID="scroll">
        {Array.from({ length: 20 }).map((_, i) => (
          <CosmicCard key={i} blur>
            <Text>Card {i}</Text>
          </CosmicCard>
        ))}
      </ScrollView>
    );
    // Should maintain 60 FPS during scroll
  });
});
```

---

## Definition of Done

- [ ] `CosmicCard` component created with full TypeScript types
- [ ] Translucent background and blur options implemented
- [ ] 3 elevation levels with shadows
- [ ] Glow border option with accent colors
- [ ] Header/footer section support
- [ ] Pressable variant with scale animation
- [ ] Nested card support verified
- [ ] Unit tests written and passing (80%+ coverage)
- [ ] Performance tests confirm < 100ms render
- [ ] Component is memoized
- [ ] Component exported from common/index.ts
- [ ] Used in at least 5 screens to validate behavior
- [ ] Code reviewed and approved
- [ ] TypeScript compiles with no errors
- [ ] Documentation added with usage examples

---

## Related Stories

- **Depends On**: 6.1 (Color System for glow border colors)
- **Blocks**: All screen implementations needing card layouts
- **Related**: 6.3 (NeonButton uses similar glow effects)

---

## Notes

- Card will be one of the most-used components in the app
- Blur effect looks premium but has performance cost - use sparingly
- Glow border creates visual hierarchy and draws attention
- Nested cards useful for complex layouts (e.g., game result cards)
- Consider providing card presets for common use cases (info card, action card, etc.)
- Elevation 1 for background cards, 2 for interactive, 3 for modals/overlays

---

**Created**: 2025-11-18
**Author**: Claude (BMAD Method)
**Status**: Drafted
