# Story 6.2: Galaxy Background Component

**Epic**: Epic 6 - Galaxy Visual Design System
**Story ID**: 6.2
**Status**: Drafted
**Effort**: Small (3-4 hours)
**Dependencies**: Story 6.1 (Color System)

---

## User Story

**As a** user
**I want** a consistent cosmic background across all screens
**So that** the app feels cohesive and immersive with a galaxy theme

---

## Acceptance Criteria

1. **Component Creation**
   - Create `GalaxyBackground` component in `src/components/common/`
   - Component accepts `intensity` prop ('subtle', 'normal', 'vibrant')
   - Component accepts `animated` boolean prop for star twinkling
   - Component accepts `children` for content overlay

2. **Visual Design**
   - Uses existing `assets/galaxybackground.png` as base
   - Intensity affects opacity/overlay of background
   - Subtle: 60% opacity, Normal: 80% opacity, Vibrant: 100% opacity
   - Optional animated stars/particles with subtle movement

3. **Performance**
   - Background uses `position: absolute` and doesn't scroll with content
   - Component is memoized with `React.memo`
   - No impact on 60 FPS scrolling performance
   - Image optimized to < 500KB

4. **Layout Behavior**
   - Works correctly with ScrollView (background stays fixed)
   - Respects safe area insets
   - Children render on top of background
   - Full screen coverage on all device sizes

5. **Accessibility**
   - Background doesn't interfere with text readability
   - Sufficient contrast maintained with text colors
   - Reduced motion setting disables star animation

6. **TypeScript**
   - Fully typed component with interface
   - No TypeScript errors
   - Proper prop validation

---

## Implementation Details

### Files to Create/Modify

**New Files:**
- `src/components/common/GalaxyBackground.tsx` - Main component
- `src/components/common/GalaxyBackground.test.tsx` - Tests
- `src/components/common/AnimatedStars.tsx` - Optional star animation

**Modified Files:**
- `src/components/common/index.ts` - Export GalaxyBackground

### Component Interface

```typescript
interface GalaxyBackgroundProps {
  intensity?: 'subtle' | 'normal' | 'vibrant';
  animated?: boolean;
  children?: React.ReactNode;
  testID?: string;
}
```

### Component Structure

```tsx
import React, { useMemo } from 'react';
import { View, ImageBackground, StyleSheet } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import AnimatedStars from './AnimatedStars';

const GalaxyBackground: React.FC<GalaxyBackgroundProps> = ({
  intensity = 'normal',
  animated = false,
  children,
  testID = 'galaxy-background',
}) => {
  const reducedMotion = useReducedMotion();

  const opacityMap = {
    subtle: 0.6,
    normal: 0.8,
    vibrant: 1.0,
  };

  const opacity = opacityMap[intensity];

  const shouldAnimate = animated && !reducedMotion;

  return (
    <View style={styles.container} testID={testID}>
      {/* Galaxy background image */}
      <ImageBackground
        source={require('../../../assets/galaxybackground.png')}
        style={[styles.background, { opacity }]}
        resizeMode="cover"
      />

      {/* Optional animated stars */}
      {shouldAnimate && <AnimatedStars />}

      {/* Content overlay */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060612', // cosmic-void fallback
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
  },
});

export default React.memo(GalaxyBackground);
```

### Animated Stars Component (Optional)

```tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const AnimatedStars: React.FC = () => {
  // Create 10-15 randomly positioned stars
  const stars = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 1, // 1-3px
  }));

  return (
    <View style={styles.starsContainer} pointerEvents="none">
      {stars.map(star => (
        <Star key={star.id} {...star} />
      ))}
    </View>
  );
};

const Star: React.FC<{
  left: string;
  top: string;
  size: number;
}> = ({ left, top, size }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    // Random twinkling effect
    const delay = Math.random() * 2000;
    const duration = 1000 + Math.random() * 1000; // 1-2 seconds

    setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration }),
          withTiming(0.3, { duration })
        ),
        -1,
        false
      );
    }, delay);
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

const styles = StyleSheet.create({
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
  },
});

export default AnimatedStars;
```

### Hook for Reduced Motion

```typescript
// src/hooks/useReducedMotion.ts
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => setReducedMotion(enabled ?? false))
      .catch(() => setReducedMotion(false));

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion
    );

    return () => subscription.remove();
  }, []);

  return reducedMotion;
}
```

---

## Technical Approach

### 1. Performance Optimization

**Memoization:**
- Wrap component with `React.memo` to prevent unnecessary re-renders
- Only re-render if intensity or animated props change

**Image Optimization:**
- Ensure `galaxybackground.png` is optimized (WebP or compressed PNG)
- Target size: < 500KB
- Resolution: 1080x2400 or similar for modern devices

**Layout:**
- Use `position: absolute` to prevent background from affecting scroll performance
- Background stays fixed while content scrolls

### 2. Intensity Levels

```typescript
const getBackgroundStyles = (intensity: Intensity) => {
  const opacityMap = {
    subtle: 0.6,
    normal: 0.8,
    vibrant: 1.0,
  };

  return {
    opacity: opacityMap[intensity],
  };
};
```

### 3. Safe Area Handling

```tsx
// Usage in screens
import { SafeAreaView } from 'react-native-safe-area-context';

<GalaxyBackground intensity="normal" animated>
  <SafeAreaView style={{ flex: 1 }}>
    {/* Screen content */}
  </SafeAreaView>
</GalaxyBackground>
```

---

## Testing Requirements

### Unit Tests

**File**: `src/components/common/__tests__/GalaxyBackground.test.tsx`

```typescript
import { render } from '@testing-library/react-native';
import GalaxyBackground from '../GalaxyBackground';

describe('GalaxyBackground', () => {
  it('renders with default props', () => {
    const { getByTestID } = render(<GalaxyBackground />);
    expect(getByTestID('galaxy-background')).toBeTruthy();
  });

  it('renders children correctly', () => {
    const { getByText } = render(
      <GalaxyBackground>
        <Text>Test Content</Text>
      </GalaxyBackground>
    );
    expect(getByText('Test Content')).toBeTruthy();
  });

  it('applies correct opacity for each intensity', () => {
    const { rerender, getByTestID } = render(
      <GalaxyBackground intensity="subtle" />
    );
    // Check opacity style

    rerender(<GalaxyBackground intensity="vibrant" />);
    // Check updated opacity
  });

  it('renders animated stars when animated=true', () => {
    const { queryByTestID } = render(
      <GalaxyBackground animated />
    );
    expect(queryByTestID('animated-stars')).toBeTruthy();
  });

  it('does not render stars when animated=false', () => {
    const { queryByTestID } = render(
      <GalaxyBackground animated={false} />
    );
    expect(queryByTestID('animated-stars')).toBeNull();
  });

  it('is memoized and does not re-render unnecessarily', () => {
    const renderSpy = jest.fn();
    const MemoizedComponent = React.memo(GalaxyBackground, () => {
      renderSpy();
      return true; // Don't re-render
    });

    const { rerender } = render(<MemoizedComponent />);
    rerender(<MemoizedComponent />);

    expect(renderSpy).toHaveBeenCalledTimes(0); // Memoization working
  });
});

describe('useReducedMotion hook', () => {
  it('returns false by default', () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('respects system reduced motion setting', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);

    const { result, waitForNextUpdate } = renderHook(() => useReducedMotion());
    await waitForNextUpdate();

    expect(result.current).toBe(true);
  });
});
```

### Visual Tests

```typescript
describe('GalaxyBackground Visual Tests', () => {
  it('renders with correct background image', () => {
    const { getByTestID } = render(<GalaxyBackground />);
    const background = getByTestID('galaxy-background');

    // Check that ImageBackground has correct source
    expect(background.props.source).toBeDefined();
  });

  it('background covers entire screen', () => {
    const { getByTestID } = render(<GalaxyBackground />);
    const background = getByTestID('galaxy-background');

    expect(background.props.style).toMatchObject({
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    });
  });
});
```

### Performance Tests

```typescript
describe('GalaxyBackground Performance', () => {
  it('renders in under 100ms', () => {
    const startTime = performance.now();
    render(<GalaxyBackground />);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(100);
  });

  it('does not affect scroll performance', async () => {
    const { getByTestID } = render(
      <GalaxyBackground>
        <ScrollView testID="scroll-view">
          {Array.from({ length: 100 }).map((_, i) => (
            <View key={i} style={{ height: 100 }}>
              <Text>Item {i}</Text>
            </View>
          ))}
        </ScrollView>
      </GalaxyBackground>
    );

    const scrollView = getByTestID('scroll-view');

    // Simulate scroll and measure FPS
    // Should maintain 60 FPS
  });
});
```

---

## Definition of Done

- [ ] `GalaxyBackground` component created and fully typed
- [ ] Intensity levels (subtle, normal, vibrant) implemented
- [ ] Optional star animation implemented
- [ ] Reduced motion accessibility support added
- [ ] Component is memoized for performance
- [ ] Unit tests written and passing (80%+ coverage)
- [ ] Visual tests confirm correct rendering
- [ ] Performance tests confirm 60 FPS during scroll
- [ ] Component exported from common/index.ts
- [ ] Used in at least 2 screens to validate behavior
- [ ] Code reviewed and approved
- [ ] TypeScript compiles with no errors
- [ ] Documentation added with usage examples

---

## Related Stories

- **Depends On**: 6.1 (Color System for fallback colors)
- **Blocks**: All screen implementation stories (provides background)
- **Related**: 6.5 (Page transitions use this background)

---

## Notes

- Background should be subtle enough not to distract from content
- Star animation is optional and should be used sparingly (special screens only)
- Component will be used on nearly every screen in the app
- Consider performance on low-end devices when implementing animations
- Background image should be optimized before bundling (use ImageOptim or similar)
- May want to provide different background images for different screen sizes (Phase 2)

---

**Created**: 2025-11-18
**Author**: Claude (BMAD Method)
**Status**: Drafted
