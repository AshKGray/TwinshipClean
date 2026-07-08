# Story 6.6: Loading States and Skeleton Screens

**Epic**: Epic 6 - Galaxy Visual Design System
**Story ID**: 6.6
**Status**: Drafted
**Effort**: Medium (4-5 hours)
**Dependencies**: Story 6.1 (Color System)

---

## User Story

**As a** user
**I want** to see elegant loading states instead of blank screens
**So that** wait times feel shorter and I understand the app is working

---

## Acceptance Criteria

1. **Skeleton Components**
   - Create `SkeletonLoader` component with 5 types: text, card, image, list-item, custom
   - Shimmer effect animation (1.5s loop)
   - Configurable dimensions (width, height, borderRadius)
   - Count prop for repeated skeletons

2. **Cosmic Spinner**
   - Create `CosmicSpinner` component with rotating galaxy animation
   - 3 size options: small, medium, large
   - Custom accent color support
   - Smooth rotation (2s per rotation)

3. **Transitions**
   - Smooth crossfade from skeleton to actual content (200ms)
   - No layout shift when content loads
   - Skeleton matches layout of actual content

4. **Performance**
   - Shimmer animation maintains 60 FPS
   - Low memory footprint
   - Efficient rendering with React.memo

5. **Timeout Handling**
   - Optional timeout prop (default: 10 seconds)
   - Error state displayed after timeout
   - Retry mechanism

6. **Accessibility**
   - Loading announcements for screen readers
   - Respects reduced motion (static skeleton)

---

## Implementation Details

### Files to Create/Modify

**New Files:**
- `src/components/common/SkeletonLoader.tsx` - Skeleton component
- `src/components/common/CosmicSpinner.tsx` - Spinner component
- `src/components/common/SkeletonLoader.test.tsx` - Tests
- `src/components/common/CosmicSpinner.test.tsx` - Tests

**Modified Files:**
- `src/components/common/index.ts` - Exports

### SkeletonLoader Component

```typescript
interface SkeletonLoaderProps {
  type: 'text' | 'card' | 'image' | 'list-item' | 'custom';
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  shimmer?: boolean;
  count?: number;
  style?: ViewStyle;
  testID?: string;
}
```

```tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'custom',
  width = '100%',
  height = 20,
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
      [-300, 300] // Adjust based on skeleton width
    );

    return {
      transform: [{ translateX: translateXValue }],
    };
  });

  const getDimensions = () => {
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
        return { width, height };
    }
  };

  const dimensions = getDimensions();

  const renderSkeleton = () => (
    <View
      style={[
        styles.skeleton,
        {
          width: dimensions.width,
          height: dimensions.height,
          borderRadius,
        },
        style,
      ]}
      testID={testID}
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
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={{ marginBottom: index < count - 1 ? 8 : 0 }}>
          {renderSkeleton()}
        </View>
      ))}
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
```

### CosmicSpinner Component

```typescript
interface CosmicSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  accentColor?: GalaxyAccentColor;
  testID?: string;
}
```

```tsx
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
import { getAccentColor } from '@/theme/colors';

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
```

### Content Crossfade Hook

```typescript
// src/hooks/useContentTransition.ts
import { useEffect, useState } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';

export function useContentTransition(isLoading: boolean) {
  const opacity = useSharedValue(0);
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      // Fade out skeleton
      opacity.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) {
          setShowSkeleton(false);
          // Fade in content
          opacity.value = withTiming(1, { duration: 200 });
        }
      });
    }
  }, [isLoading]);

  return { opacity, showSkeleton };
}
```

### Usage Example

```tsx
// In a screen component
const { data, isLoading } = useFetchData();
const { opacity, showSkeleton } = useContentTransition(isLoading);

return (
  <View>
    {showSkeleton ? (
      <SkeletonLoader type="card" count={3} shimmer />
    ) : (
      <Animated.View style={{ opacity }}>
        {data.map(item => (
          <CosmicCard key={item.id}>
            <Text>{item.title}</Text>
          </CosmicCard>
        ))}
      </Animated.View>
    )}
  </View>
);
```

---

## Technical Approach

### 1. Shimmer Animation

```typescript
// Shimmer moves from left to right continuously
const translateX = useSharedValue(-1);

useEffect(() => {
  translateX.value = withRepeat(
    withTiming(1, { duration: 1500 }),
    -1, // Infinite loop
    false
  );
}, []);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{
    translateX: interpolate(
      translateX.value,
      [-1, 1],
      [-300, 300]
    ),
  }],
}));
```

### 2. Skeleton Types

```typescript
// Predefined dimensions for common skeleton types
const SKELETON_PRESETS = {
  text: { width: '80%', height: 16 },
  card: { width: '100%', height: 200 },
  image: { width: 100, height: 100 },
  'list-item': { width: '100%', height: 60 },
};
```

### 3. Timeout Handling

```typescript
const [timedOut, setTimedOut] = useState(false);

useEffect(() => {
  if (timeout) {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, timeout);

    return () => clearTimeout(timer);
  }
}, [timeout]);

if (timedOut) {
  return <ErrorState onRetry={() => setTimedOut(false)} />;
}
```

---

## Testing Requirements

### Unit Tests

```typescript
describe('SkeletonLoader', () => {
  it('renders with default props', () => {
    const { getByTestID } = render(<SkeletonLoader testID="skeleton" />);
    expect(getByTestID('skeleton')).toBeTruthy();
  });

  it('renders multiple skeletons with count prop', () => {
    const { getAllByTestID } = render(
      <SkeletonLoader count={3} testID="skeleton" />
    );
    expect(getAllByTestID('skeleton')).toHaveLength(3);
  });

  it('applies correct dimensions for text type', () => {
    const { getByTestID } = render(
      <SkeletonLoader type="text" testID="skeleton" />
    );
    const skeleton = getByTestID('skeleton');
    expect(skeleton.props.style.width).toBe('80%');
    expect(skeleton.props.style.height).toBe(16);
  });

  it('renders shimmer animation', () => {
    const { getByTestID } = render(
      <SkeletonLoader shimmer testID="skeleton" />
    );
    // Check for animated gradient
  });

  it('disables shimmer when reduce motion enabled', () => {
    jest.spyOn(require('@/hooks/useReducedMotion'), 'useReducedMotion').mockReturnValue(true);

    const { queryByTestID } = render(
      <SkeletonLoader shimmer testID="skeleton" />
    );
    // Shimmer should not animate
  });
});

describe('CosmicSpinner', () => {
  it('renders with default props', () => {
    const { getByTestID } = render(<CosmicSpinner testID="spinner" />);
    expect(getByTestID('spinner')).toBeTruthy();
  });

  it('applies correct size for small variant', () => {
    const { getByTestID } = render(
      <CosmicSpinner size="small" testID="spinner" />
    );
    // Check width/height: 24
  });

  it('rotates continuously', async () => {
    const { getByTestID } = render(<CosmicSpinner testID="spinner" />);
    // Verify rotation animation
  });

  it('uses custom accent color', () => {
    const { getByTestID } = render(
      <CosmicSpinner accentColor="nebula-rose" testID="spinner" />
    );
    // Check gradient colors
  });
});
```

### Performance Tests

```typescript
describe('Loading State Performance', () => {
  it('shimmer animation maintains 60 FPS', async () => {
    const fpsMonitor = startFPSMonitoring();
    render(<SkeletonLoader shimmer count={10} />);
    await wait(3000); // Monitor for 3 seconds
    const avgFPS = fpsMonitor.stop();

    expect(avgFPS).toBeGreaterThanOrEqual(58);
  });

  it('crossfade transition is smooth', async () => {
    const { rerender } = render(<SkeletonLoader />);

    const fpsMonitor = startFPSMonitoring();
    rerender(<View><Text>Content</Text></View>);
    await wait(300); // Transition duration
    const avgFPS = fpsMonitor.stop();

    expect(avgFPS).toBeGreaterThanOrEqual(58);
  });
});
```

---

## Definition of Done

- [ ] `SkeletonLoader` component created with 5 types
- [ ] Shimmer animation implemented (1.5s loop, 60 FPS)
- [ ] `CosmicSpinner` component with rotating galaxy effect
- [ ] Content crossfade transition (200ms)
- [ ] Timeout handling with error state
- [ ] Reduced motion support
- [ ] Unit tests written and passing (80%+ coverage)
- [ ] Performance tests confirm 60 FPS
- [ ] Components memoized for efficiency
- [ ] Components exported from common/index.ts
- [ ] Used in at least 5 loading scenarios
- [ ] Code reviewed and approved
- [ ] TypeScript compiles with no errors
- [ ] Documentation with usage examples

---

## Related Stories

- **Depends On**: 6.1 (Color System for shimmer colors)
- **Blocks**: All screens with async data loading
- **Related**: 6.5 (Transitions use similar animation techniques)

---

## Notes

- Skeleton screens improve perceived performance significantly
- Shimmer effect should be subtle, not distracting
- Match skeleton layout exactly to actual content to prevent layout shift
- Use skeleton for slower operations (>500ms)
- Use spinner for quick operations (<500ms)
- Consider skeleton screen library for complex layouts (Phase 2)
- Timeout handling prevents users from waiting indefinitely

---

**Created**: 2025-11-18
**Author**: Claude (BMAD Method)
**Status**: Drafted
