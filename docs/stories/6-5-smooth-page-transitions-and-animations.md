# Story 6.5: Smooth Page Transitions and Animations

**Epic**: Epic 6 - Galaxy Visual Design System
**Story ID**: 6.5
**Status**: Drafted
**Effort**: Medium (5-6 hours)
**Dependencies**: Story 6.1 (Color System)

---

## User Story

**As a** user
**I want** smooth transitions between screens
**So that** navigation feels fluid and polished

---

## Acceptance Criteria

1. **Transition Types**
   - Fade transition (300ms)
   - Slide transitions (left, right, up, down)
   - Scale transition (zoom in/out)
   - Slide-from-bottom modal transition

2. **React Navigation Integration**
   - Custom transitions work with React Navigation v7
   - Transitions applied to stack navigator
   - Tab navigator uses appropriate transitions
   - Modal screens use slide-from-bottom

3. **Shared Element Transitions**
   - Support for shared element transitions between screens
   - Image hero transitions
   - Smooth element morphing

4. **Performance**
   - All transitions maintain 60 FPS
   - Transitions use native driver
   - No jank or stuttering on low-end devices

5. **Accessibility**
   - Respect system "reduce motion" setting
   - Instant transitions when reduce motion enabled
   - Configurable animation duration

6. **Animation Presets**
   - Export reusable animation configs
   - Consistent timing curves across app
   - Quick (200ms), Normal (300ms), Slow (500ms) presets

---

## Implementation Details

### Files to Create/Modify

**New Files:**
- `src/navigation/transitions.ts` - Transition configurations
- `src/theme/animations.ts` - Animation presets
- `src/hooks/useReducedMotion.ts` - Accessibility hook (if not created in 6.2)

**Modified Files:**
- `src/navigation/AppNavigator.tsx` - Apply custom transitions

### Transition Configurations

```typescript
// src/navigation/transitions.ts
import { StackNavigationOptions } from '@react-navigation/stack';
import { Easing } from 'react-native-reanimated';

export const TRANSITIONS = {
  fade: (): StackNavigationOptions => ({
    cardStyleInterpolator: ({ current }) => ({
      cardStyle: {
        opacity: current.progress,
      },
    }),
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        },
      },
    },
  }),

  slideFromRight: (): StackNavigationOptions => ({
    cardStyleInterpolator: ({ current, layouts }) => ({
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
        ],
      },
    }),
    transitionSpec: {
      open: {
        animation: 'spring',
        config: {
          stiffness: 300,
          damping: 30,
          mass: 1,
        },
      },
      close: {
        animation: 'spring',
        config: {
          stiffness: 300,
          damping: 30,
          mass: 1,
        },
      },
    },
  }),

  slideFromBottom: (): StackNavigationOptions => ({
    cardStyleInterpolator: ({ current, layouts }) => ({
      cardStyle: {
        transform: [
          {
            translateY: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.height, 0],
            }),
          },
        ],
      },
    }),
    transitionSpec: {
      open: {
        animation: 'spring',
        config: {
          stiffness: 300,
          damping: 30,
          mass: 1,
        },
      },
      close: {
        animation: 'spring',
        config: {
          stiffness: 300,
          damping: 30,
          mass: 1,
        },
      },
    },
  }),

  scale: (): StackNavigationOptions => ({
    cardStyleInterpolator: ({ current }) => ({
      cardStyle: {
        opacity: current.progress,
        transform: [
          {
            scale: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1],
            }),
          },
        ],
      },
    }),
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: 300,
          easing: Easing.out(Easing.ease),
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 200,
          easing: Easing.in(Easing.ease),
        },
      },
    },
  }),
};

// Helper to create custom transitions
export function createTransition(
  type: 'fade' | 'slide' | 'scale',
  duration: number = 300
): StackNavigationOptions {
  // Implementation based on type
}
```

### Animation Presets

```typescript
// src/theme/animations.ts
import { Easing } from 'react-native-reanimated';

export const ANIMATION_PRESETS = {
  quick: {
    duration: 200,
    easing: Easing.inOut(Easing.ease),
  },
  normal: {
    duration: 300,
    easing: Easing.inOut(Easing.ease),
  },
  slow: {
    duration: 500,
    easing: Easing.inOut(Easing.ease),
  },
  spring: {
    damping: 20,
    stiffness: 300,
    mass: 1,
  },
  bouncy: {
    damping: 10,
    stiffness: 200,
    mass: 1,
  },
};

export const EASING_CURVES = {
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
  linear: Easing.linear,
  elastic: Easing.elastic(1),
};
```

### Navigator Integration

```tsx
// src/navigation/AppNavigator.tsx
import { TRANSITIONS } from './transitions';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const reducedMotion = useReducedMotion();

  // Instant transitions if reduce motion enabled
  const defaultTransition = reducedMotion
    ? { animation: 'none' }
    : TRANSITIONS.slideFromRight();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...defaultTransition,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
      />

      {/* Modal screens use slide from bottom */}
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={TRANSITIONS.slideFromBottom()}
      />

      {/* Fade for certain screens */}
      <Stack.Screen
        name="Results"
        component={ResultsScreen}
        options={TRANSITIONS.fade()}
      />
    </Stack.Navigator>
  );
}
```

### Shared Element Transitions

```tsx
// Example shared element transition
import { SharedElement } from 'react-navigation-shared-element';

// Source screen
<SharedElement id="game-card-1">
  <CosmicCard onPress={() => navigate('GameDetail', { id: 1 })}>
    <Image source={gameImage} />
  </CosmicCard>
</SharedElement>

// Destination screen
<SharedElement id="game-card-1">
  <Image source={gameImage} style={styles.heroImage} />
</SharedElement>

// Navigation config
GameDetailScreen.sharedElements = (route) => {
  const { id } = route.params;
  return [`game-card-${id}`];
};
```

---

## Technical Approach

### 1. Reduced Motion Support

```typescript
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => setReducedMotion(enabled ?? false));

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion
    );

    return () => subscription.remove();
  }, []);

  return reducedMotion;
}
```

### 2. Custom Transition Factory

```typescript
export function createTransition(
  type: TransitionType,
  config: TransitionConfig = {}
): StackNavigationOptions {
  const { duration = 300, easing = Easing.inOut(Easing.ease) } = config;

  const baseConfig = {
    transitionSpec: {
      open: { animation: 'timing', config: { duration, easing } },
      close: { animation: 'timing', config: { duration, easing } },
    },
  };

  switch (type) {
    case 'fade':
      return { ...baseConfig, ...TRANSITIONS.fade() };
    case 'slide':
      return { ...baseConfig, ...TRANSITIONS.slideFromRight() };
    case 'scale':
      return { ...baseConfig, ...TRANSITIONS.scale() };
  }
}
```

### 3. Performance Optimization

```typescript
// Use native driver for all animations
transitionSpec: {
  open: {
    animation: 'timing',
    config: {
      duration: 300,
      useNativeDriver: true, // Key for 60 FPS
    },
  },
}

// Optimize card style interpolator
cardStyleInterpolator: ({ current, layouts }) => {
  'worklet'; // Reanimated worklet for best performance

  return {
    cardStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.width, 0],
          }),
        },
      ],
    },
  };
};
```

---

## Testing Requirements

### Unit Tests

```typescript
describe('Transitions', () => {
  it('exports all transition configs', () => {
    expect(TRANSITIONS.fade).toBeDefined();
    expect(TRANSITIONS.slideFromRight).toBeDefined();
    expect(TRANSITIONS.slideFromBottom).toBeDefined();
    expect(TRANSITIONS.scale).toBeDefined();
  });

  it('createTransition generates correct config', () => {
    const transition = createTransition('fade', { duration: 500 });
    expect(transition.transitionSpec.open.config.duration).toBe(500);
  });
});

describe('Animation Presets', () => {
  it('exports all animation presets', () => {
    expect(ANIMATION_PRESETS.quick).toBeDefined();
    expect(ANIMATION_PRESETS.normal).toBeDefined();
    expect(ANIMATION_PRESETS.slow).toBeDefined();
    expect(ANIMATION_PRESETS.spring).toBeDefined();
  });

  it('quick preset has correct duration', () => {
    expect(ANIMATION_PRESETS.quick.duration).toBe(200);
  });
});
```

### Integration Tests

```typescript
describe('Navigator Transitions', () => {
  it('applies default transition to screens', () => {
    const { getByText } = render(<AppNavigator />);
    // Navigate and verify transition applied
  });

  it('uses instant transition when reduced motion enabled', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);

    const { getByText } = render(<AppNavigator />);
    // Verify no animation when navigating
  });
});
```

### Performance Tests

```typescript
describe('Transition Performance', () => {
  it('maintains 60 FPS during transition', async () => {
    // Use React Native Performance API
    const { navigate } = render(<AppNavigator />);

    const fpsMonitor = startFPSMonitoring();
    navigate('Details');
    await waitForTransition();
    const avgFPS = fpsMonitor.stop();

    expect(avgFPS).toBeGreaterThanOrEqual(58); // Allow 2 FPS margin
  });
});
```

---

## Definition of Done

- [ ] All 4 transition types implemented (fade, slide, scale, modal)
- [ ] Transition configs exported from transitions.ts
- [ ] Animation presets defined in animations.ts
- [ ] React Navigation integration complete
- [ ] Reduced motion support implemented
- [ ] Shared element transition support added
- [ ] All transitions maintain 60 FPS
- [ ] Unit tests written and passing
- [ ] Integration tests verify navigator behavior
- [ ] Performance tests confirm FPS targets
- [ ] Applied to AppNavigator
- [ ] Code reviewed and approved
- [ ] TypeScript compiles with no errors
- [ ] Documentation added with usage examples

---

## Related Stories

- **Depends On**: 6.1 (Color System), 6.2 (Galaxy Background for transition backgrounds)
- **Blocks**: All navigation flows benefit from smooth transitions
- **Related**: 6.6 (Loading states use similar animation patterns)

---

## Notes

- Transitions should feel snappy but not rushed (300ms sweet spot)
- Spring animations feel more natural for slide transitions
- Fade transitions work well for non-directional navigation
- Modal sheets should always slide from bottom on mobile
- Reduce motion is critical for accessibility and battery life
- Consider A/B testing different transition durations with users
- Shared element transitions create continuity between screens

---

**Created**: 2025-11-18
**Author**: Claude (BMAD Method)
**Status**: Drafted
