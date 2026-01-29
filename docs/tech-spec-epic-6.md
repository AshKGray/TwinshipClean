# Epic Technical Specification: Galaxy Visual Design System

Date: 2025-11-18
Author: Claude (BMAD Method)
Epic ID: 6
Status: Draft

---

## Overview

Epic 6 establishes Twinship's distinctive visual identity by implementing a comprehensive galaxy-themed design system with cosmic aesthetics, neon accents, smooth animations, and haptic feedback. This epic creates a cohesive, polished UI/UX that makes the app feel premium and memorable while maintaining excellent performance and accessibility.

This specification covers the design system foundation, reusable UI components, animation patterns, loading states, and haptic feedback implementation using NativeWind, React Native Reanimated, and Expo Haptics. The epic provides the visual infrastructure that all other features will use to maintain brand consistency.

## Objectives and Scope

**In Scope:**
- Centralized galaxy-themed color system with 8 accent colors
- Reusable galaxy background component with optional intensity levels
- Neon glow button component with haptic feedback
- Cosmic card component with translucent blur effects
- Custom screen transition animations (fade, slide, scale)
- Loading states with shimmer effects and cosmic spinner
- Skeleton screen components for content placeholders
- Haptic feedback system with interaction patterns
- Theme utilities and color manipulation functions
- Accessibility compliance (WCAG AA color contrast)

**Out of Scope:**
- Dark/light theme toggle (dark theme only in MVP)
- Advanced particle effects or complex animations
- Custom icon library (using Expo vector icons)
- Animated illustrations or lottie files
- Sound effects or audio feedback
- Accessibility features beyond WCAG AA (AAA in Phase 2)
- Custom font families (using system fonts)

**Success Criteria:**
- All animations maintain 60 FPS on target devices
- Color contrast meets WCAG AA standards
- Design system reduces component development time by 50%
- Components are reusable across 80% of screens
- Users perceive app as "premium" and "polished" in testing
- Zero performance regressions from animations

## System Architecture Alignment

**React Native Mobile App Architecture:**

This epic integrates with the existing Twinship mobile architecture as follows:

1. **Theme System** (`src/theme/`):
   - `colors.ts`: Galaxy color palette and accent colors
   - `gradients.ts`: Gradient definitions for cosmic effects
   - `animations.ts`: Reanimated animation presets
   - `haptics.ts`: Haptic feedback patterns
   - `shadows.ts`: Elevation and shadow styles

2. **Component Library** (`src/components/common/`):
   - `GalaxyBackground.tsx`: Reusable background component
   - `NeonButton.tsx`: Primary button with glow effects
   - `CosmicCard.tsx`: Card container with blur
   - `CosmicSpinner.tsx`: Loading spinner
   - `SkeletonLoader.tsx`: Skeleton screens
   - `GradientText.tsx`: Text with gradient effects

3. **Navigation Integration** (`src/navigation/`):
   - `transitions.ts`: Custom screen transitions
   - Integration with React Navigation v7

4. **Design Patterns:**
   - Atomic design methodology (atoms, molecules, organisms)
   - Consistent spacing scale (4px base unit)
   - Typography hierarchy (headings, body, captions)
   - Elevation system (3 levels)

**Existing Patterns:**
- Builds on existing `galaxybackground.png` usage
- Extends current NativeWind/Tailwind configuration
- Follows established component naming conventions
- Maintains existing accessibility patterns

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Inputs | Outputs | Owner |
|----------------|---------------|--------|---------|-------|
| `colors.ts` | Define color palette and utilities | Color names | Hex/RGB values, variants | Story 6.1 |
| `gradients.ts` | Define gradient combinations | Gradient names | LinearGradient props | Story 6.1 |
| `GalaxyBackground.tsx` | Reusable cosmic background | Intensity level | Rendered background | Story 6.2 |
| `NeonButton.tsx` | Interactive button with glow | Props (variant, size) | Rendered button | Story 6.3 |
| `CosmicCard.tsx` | Card container component | Props (elevation, blur) | Rendered card | Story 6.4 |
| `transitions.ts` | Screen transition configs | Transition type | Animation config | Story 6.5 |
| `SkeletonLoader.tsx` | Loading placeholder | Content type | Skeleton UI | Story 6.6 |
| `CosmicSpinner.tsx` | Loading spinner | Size | Animated spinner | Story 6.6 |
| `haptics.ts` | Haptic feedback system | Interaction type | Haptic trigger | Story 6.7 |

**Module Dependencies:**
- All components depend on `NativeWind` for styling
- Animations depend on `react-native-reanimated`
- Haptics depend on `expo-haptics`
- Gradients depend on `expo-linear-gradient`
- Blur effects depend on `expo-blur` or React Native blur

### Data Models and Contracts

**Color System:**
```typescript
// Galaxy Theme Color Palette
type GalaxyColor = {
  // Accent Colors (user-selectable)
  'nebula-rose': string;
  'stellar-blue': string;
  'orbit-sage': string;
  'solar-amber': string;
  'celestial-indigo': string;
  'comet-coral': string;
  'aurora-teal': string;
  'meteor-copper': string;

  // Base Colors (UI foundation)
  'deep-space': string;         // Background dark
  'cosmic-void': string;         // Background darker
  'stardust': string;            // Text primary
  'moonlight': string;           // Text secondary
  'nebula-mist': string;         // Border/divider

  // Semantic Colors
  'success': string;
  'error': string;
  'warning': string;
  'info': string;
};

// Color with variants
interface ColorWithVariants {
  base: string;                  // Base color (500)
  light: string;                 // Lighter variant (300)
  dark: string;                  // Darker variant (700)
  glow: string;                  // Glow/neon variant (with opacity)
}

// Gradient definition
interface GalaxyGradient {
  colors: string[];              // Array of hex colors
  start: { x: number; y: number };
  end: { x: number; y: number };
  locations?: number[];          // Optional color stops
}
```

**Component Props Interfaces:**
```typescript
// GalaxyBackground
interface GalaxyBackgroundProps {
  intensity?: 'subtle' | 'normal' | 'vibrant';
  animated?: boolean;            // Subtle star twinkling
  children?: React.ReactNode;
}

// NeonButton
interface NeonButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'small' | 'medium' | 'large';
  accentColor?: GalaxyAccentColor;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  hapticFeedback?: HapticPattern;
  children: React.ReactNode;
}

// CosmicCard
interface CosmicCardProps {
  elevation?: 1 | 2 | 3;
  blur?: boolean;                // Backdrop blur effect
  glowBorder?: boolean;
  accentColor?: GalaxyAccentColor;
  onPress?: () => void;          // Makes card pressable
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

// SkeletonLoader
interface SkeletonLoaderProps {
  type: 'text' | 'card' | 'image' | 'list-item' | 'custom';
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  shimmer?: boolean;             // Enable shimmer animation
  count?: number;                // For repeated skeletons
}

// Haptic patterns
type HapticPattern =
  | 'light'                      // Light tap
  | 'medium'                     // Medium impact
  | 'heavy'                      // Heavy impact
  | 'success'                    // Success notification
  | 'warning'                    // Warning notification
  | 'error'                      // Error notification
  | 'selection';                 // Selection change
```

**Animation Configs:**
```typescript
// Screen transition config
interface TransitionConfig {
  type: 'fade' | 'slide' | 'scale' | 'slide-from-bottom';
  duration: number;              // Milliseconds
  easing: Easing;
}

// Reanimated animation presets
interface AnimationPreset {
  name: string;
  config: WithTimingConfig;
  description: string;
}

// Example presets
const ANIMATION_PRESETS = {
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
  },
};
```

**Spacing and Typography:**
```typescript
// Spacing scale (4px base unit)
const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography hierarchy
interface TypographyStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
  letterSpacing?: number;
}

const TYPOGRAPHY = {
  h1: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  h2: { fontSize: 24, lineHeight: 32, fontWeight: '600' },
  h3: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  small: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
};

// Shadow/Elevation
interface Elevation {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;             // Android elevation
}

const ELEVATIONS = {
  1: { /* subtle shadow */ },
  2: { /* medium shadow */ },
  3: { /* prominent shadow */ },
};
```

### APIs and Interfaces

**Theme Utilities:**

```typescript
// colors.ts exports
export const GALAXY_COLORS: GalaxyColor;
export function getAccentColor(name: GalaxyAccentColor): ColorWithVariants;
export function getGlowColor(baseColor: string, opacity?: number): string;
export function hexToRgba(hex: string, alpha: number): string;
export function adjustBrightness(hex: string, amount: number): string;
export function meetsContrastRequirement(foreground: string, background: string): boolean;

// gradients.ts exports
export const GALAXY_GRADIENTS: Record<string, GalaxyGradient>;
export function createGradient(colors: string[], direction?: 'vertical' | 'horizontal' | 'diagonal'): GalaxyGradient;

// haptics.ts exports
export function triggerHaptic(pattern: HapticPattern): Promise<void>;
export function setupHaptics(): void;
export function isHapticsAvailable(): boolean;

// animations.ts exports
export const TRANSITIONS: Record<string, TransitionConfig>;
export function createFadeTransition(duration?: number): TransitionConfig;
export function createSlideTransition(direction: 'left' | 'right' | 'up' | 'down', duration?: number): TransitionConfig;
export function createScaleTransition(duration?: number): TransitionConfig;
```

**Component APIs:**

```typescript
// GalaxyBackground usage
<GalaxyBackground intensity="normal" animated>
  {children}
</GalaxyBackground>

// NeonButton usage
<NeonButton
  variant="primary"
  size="large"
  accentColor="stellar-blue"
  onPress={handlePress}
  loading={isLoading}
  hapticFeedback="medium"
>
  Continue
</NeonButton>

// CosmicCard usage
<CosmicCard elevation={2} blur glowBorder accentColor="nebula-rose">
  <View className="p-4">
    <Text>Card content</Text>
  </View>
</CosmicCard>

// SkeletonLoader usage
<SkeletonLoader type="card" shimmer count={3} />

// Haptic trigger
import { triggerHaptic } from '@/theme/haptics';

function handleButtonPress() {
  triggerHaptic('medium');
  // ... rest of logic
}
```

**React Navigation Integration:**

```typescript
// Apply custom transitions
import { TRANSITIONS } from '@/theme/animations';

const Stack = createNativeStackNavigator();

<Stack.Navigator
  screenOptions={{
    animation: 'slide_from_right', // Default
    customAnimationOnGesture: true,
    ...TRANSITIONS.fade,           // Override with custom
  }}
>
  <Stack.Screen name="Home" component={HomeScreen} />
</Stack.Navigator>
```

### Workflows and Sequencing

**Theme Initialization Flow:**
```
App starts
  ↓
Load user's selected accent color from twinStore
  ↓
Initialize theme system with accent color
  ↓
Apply color to NativeWind config
  ↓
Render app with themed components
```

**Button Interaction Flow:**
```
User taps NeonButton
  ↓
Trigger haptic feedback (expo-haptics)
  ↓
Animate glow effect (React Native Reanimated)
  ↓
Execute onPress callback
  ↓
If loading: Show spinner animation
  ↓
On completion: Return to normal state
```

**Screen Transition Flow:**
```
User navigates to new screen
  ↓
React Navigation triggers transition
  ↓
Apply custom transition config
  ↓
Animate: Fade out current + Fade in next (300ms)
  ↓
Trigger enter animations on new screen
  ↓
Complete transition
```

**Loading State Flow:**
```
Data fetch starts
  ↓
Display SkeletonLoader matching content layout
  ↓
Shimmer animation runs (React Native Reanimated)
  ↓
Data arrives
  ↓
Crossfade: Skeleton → Real content (200ms)
  ↓
Display loaded content
```

**Skeleton to Content Transition:**
```
SkeletonLoader displays
  ↓
Shimmer animation loop (1.5s per cycle)
  ↓
Data ready signal received
  ↓
Fade out shimmer effect (100ms)
  ↓
Fade in real content (200ms)
  ↓
Remove skeleton from DOM
```

## Non-Functional Requirements

### Performance

**Target Metrics:**
- **Animation Frame Rate**: 60 FPS for all animations
- **Screen Transition**: < 300ms for all transitions
- **Shimmer Animation**: Smooth 60 FPS loop
- **Haptic Latency**: < 50ms from trigger to feedback
- **Component Render**: < 100ms for complex components
- **Theme Switch**: < 500ms to apply new accent color
- **Memory Usage**: < 50MB for design system assets

**Performance Requirements:**
1. **Native Driver**: All animations use native driver (useNativeDriver: true)
2. **Optimized Re-renders**: Memoize expensive components (React.memo)
3. **Efficient Animations**: Use Reanimated worklets for best performance
4. **Lazy Loading**: Load heavy components on-demand
5. **Asset Optimization**: Galaxy background < 500KB

**Performance Optimizations:**
- Use `useMemo` for color calculations
- Debounce rapid haptic triggers (prevent spam)
- Preload common gradients and shadows
- Cache computed styles
- Use `shouldComponentUpdate` for static elements

### Accessibility

**WCAG AA Compliance:**
- **Color Contrast**: All text meets 4.5:1 ratio (normal) or 3:1 (large)
- **Touch Targets**: Minimum 44x44 points for interactive elements
- **Screen Readers**: All components have proper labels
- **Focus Indicators**: Clear focus states for keyboard navigation
- **Reduced Motion**: Respect system accessibility settings

**Accessibility Features:**
- Haptics provide non-visual feedback
- High contrast borders on cards
- Clear visual hierarchy with spacing
- Semantic HTML elements (RN equivalents)
- Alt text for all decorative elements

**Testing:**
- Automated contrast checking in CI
- Manual testing with VoiceOver/TalkBack
- Validation with axe DevTools
- User testing with accessibility users

### Usability

**Design Principles:**
- **Consistency**: Same patterns across all screens
- **Feedback**: Immediate visual and tactile feedback
- **Clarity**: Clear visual hierarchy and labels
- **Delight**: Subtle animations create joy
- **Performance**: Never sacrifice speed for aesthetics

**User Experience Goals:**
- Users perceive app as "premium" and "polished"
- Interactions feel responsive and satisfying
- Visual design reinforces twin connection theme
- Loading states reduce perceived wait time
- Haptics enhance sense of interaction

## Dependencies and Integrations

### NPM Dependencies

**Core Framework:**
| Package | Version | Purpose | Epic 6 Usage |
|---------|---------|---------|--------------|
| `expo` | 53.0.22 | React Native framework | Core platform |
| `react-native` | 0.79.5 | Mobile platform | All components |
| `typescript` | 5.8.3 | Type safety | All code |

**Styling & Design:**
| Package | Version | Purpose | Epic 6 Usage |
|---------|---------|---------|--------------|
| `nativewind` | 4.1.23 | Tailwind CSS for RN | All styling |
| `tailwindcss` | 3.4.17 | CSS framework | Theme config |
| `expo-linear-gradient` | 14.1.5 | Gradients | Cosmic effects |
| `@expo/vector-icons` | 14.1.0 | Icon library | Button icons |
| `expo-blur` | 14.1.6 | Blur effects | Cosmic cards |

**Animations:**
| Package | Version | Purpose | Epic 6 Usage |
|---------|---------|---------|--------------|
| `react-native-reanimated` | 3.17.4 | Animations | All animations |
| `react-native-gesture-handler` | 2.24.0 | Gestures | Swipe interactions |

**Haptics:**
| Package | Version | Purpose | Epic 6 Usage |
|---------|---------|---------|--------------|
| `expo-haptics` | 14.1.4 | Haptic feedback | Interaction feedback |

**Utilities:**
| Package | Version | Purpose | Epic 6 Usage |
|---------|---------|---------|--------------|
| `color` | 4.2.3 | Color manipulation | Variants, contrast |
| `expo-constants` | 17.1.5 | App constants | Accessibility settings |

### External Integrations

**Phase 1 (Epic 6 - Local Only):**
- No external API integrations
- All design system local to app
- Assets bundled with app

**Future Enhancements:**
- Theme marketplace (custom themes)
- User-uploaded background images
- Cloud-synced theme preferences

### Internal Module Dependencies

**Epic 6 provides foundation for:**
- **All Epics**: Design system used everywhere
- **Epic 1**: Onboarding screens use NeonButton, CosmicCard
- **Epic 2**: Games use custom animations, loading states
- **Epic 3**: Twintuition uses haptics, neon effects
- **Epic 4**: Stories use cosmic cards, transitions
- **Epic 5**: Research screens use design system

**Epic 6 depends on:**
- Existing NativeWind configuration
- Existing `galaxybackground.png` asset
- React Navigation v7 for transition integration

## Acceptance Criteria (Authoritative)

### AC-6.1: Galaxy Theme Color System and Variables
1. Define 8 galaxy-themed accent colors with hex values
2. Define base UI colors (backgrounds, text, borders)
3. Each accent color has light, base, dark, and glow variants
4. Export color utility functions (hexToRgba, adjustBrightness)
5. All color combinations meet WCAG AA contrast (4.5:1)
6. Gradient definitions for cosmic effects (3+ gradients)
7. Colors integrate with NativeWind config
8. TypeScript types for all color values
9. Documentation with color swatches

### AC-6.2: Galaxy Background Component
1. GalaxyBackground component accepts intensity prop (subtle/normal/vibrant)
2. Uses existing `galaxybackground.png` asset
3. Optional animated prop for subtle star twinkling
4. Works with ScrollView (doesn't scroll with content)
5. Performance: No impact on 60 FPS scrolling
6. Component is memoized for efficiency
7. Supports children rendering on top
8. Safe area insets respected

### AC-6.3: Neon Glow Button Component
1. NeonButton component with 4 variants (primary, secondary, outline, ghost)
2. 3 size options (small, medium, large)
3. Glow effect intensifies on press (Reanimated animation)
4. Haptic feedback triggers on press (expo-haptics)
5. Loading state with animated spinner
6. Disabled state with reduced opacity
7. Supports custom accent color prop
8. Minimum 44x44 touch target
9. Accessible with screen reader labels

### AC-6.4: Cosmic Card Component
1. CosmicCard component with translucent background
2. Optional backdrop blur effect (expo-blur)
3. 3 elevation levels with glow shadows
4. Optional glowBorder with accent color
5. Supports header, content, footer sections
6. Pressable variant for navigation cards
7. Nested card support (card within card)
8. Performance: < 100ms render time

### AC-6.5: Smooth Page Transitions and Animations
1. Custom fade transition config (300ms)
2. Slide transition (left, right, up, down)
3. Scale transition config
4. Integration with React Navigation v7
5. Shared element transition support
6. Respects system "reduce motion" setting
7. All transitions maintain 60 FPS
8. Animation presets exported for reuse

### AC-6.6: Loading States and Skeleton Screens
1. SkeletonLoader component with 5 types (text, card, image, list-item, custom)
2. Shimmer effect animation (1.5s loop)
3. CosmicSpinner component (rotating galaxy animation)
4. Smooth crossfade from skeleton to content (200ms)
5. Skeleton matches layout of actual content
6. Timeout handling (error state after 10s)
7. Reusable skeleton components library
8. Performance: 60 FPS shimmer animation

### AC-6.7: Haptic Feedback System
1. Haptic utility with 7 patterns (light, medium, heavy, success, warning, error, selection)
2. Check device support before triggering
3. Respect system haptic settings
4. < 50ms latency from trigger to feedback
5. Prevent haptic spam (debounce rapid triggers)
6. Fallback gracefully if haptics unavailable
7. Integration with all interactive components
8. Documentation with pattern usage guide

### AC-6.8: Cross-Cutting Requirements
1. All components use NativeWind for styling
2. All animations use React Native Reanimated
3. TypeScript strict mode with no errors
4. Storybook documentation for all components (Phase 2)
5. Unit tests for utility functions (80% coverage)
6. Visual regression tests for components
7. Performance benchmarks pass (60 FPS)
8. Accessibility audit passes

## Traceability Mapping

| Acceptance Criteria | Tech Spec Section(s) | Component(s)/API(s) | Test Strategy |
|---------------------|---------------------|---------------------|---------------|
| **AC-6.1: Color System** | | | |
| AC-6.1.1: 8 accent colors | Data Models: GalaxyColor | colors.ts export | Unit test: Color count |
| AC-6.1.2: Base UI colors | Data Models: GalaxyColor | colors.ts export | Visual test: Color palette |
| AC-6.1.3: Color variants | Data Models: ColorWithVariants | getAccentColor() | Unit test: Variants generated |
| AC-6.1.4: Utility functions | APIs: Theme Utilities | hexToRgba, adjustBrightness | Unit test: Color math |
| AC-6.1.5: WCAG AA contrast | Non-Functional: Accessibility | meetsContrastRequirement() | Automated contrast check |
| AC-6.1.6: Gradient definitions | Data Models: GalaxyGradient | gradients.ts export | Visual test: Gradients render |
| AC-6.1.7: NativeWind integration | Services: colors.ts | tailwind.config.js | Integration test: Tailwind classes work |
| AC-6.1.8: TypeScript types | Data Models | GalaxyColor type | Type test: No TS errors |
| AC-6.1.9: Documentation | -- | Color swatch docs | Manual review |
| **AC-6.2: Galaxy Background** | | | |
| AC-6.2.1: Intensity prop | Data Models: GalaxyBackgroundProps | GalaxyBackground.tsx | UI test: 3 intensity levels |
| AC-6.2.2: Uses galaxybackground.png | Services: GalaxyBackground | Image source | Visual test: Asset loads |
| AC-6.2.3: Animated stars | Workflows: Theme Init | Reanimated animation | Visual test: Stars twinkle |
| AC-6.2.4: Scroll behavior | Services: GalaxyBackground | position: absolute | UI test: Doesn't scroll with content |
| AC-6.2.5: 60 FPS scrolling | Performance: Target Metrics | Performance monitor | Performance test: FPS tracking |
| AC-6.2.6: Memoized | Performance: Optimizations | React.memo | Unit test: Re-render check |
| AC-6.2.7: Children support | Data Models: GalaxyBackgroundProps | children prop | UI test: Children render on top |
| AC-6.2.8: Safe area insets | Cross-Cutting | SafeAreaView | UI test: Respects safe areas |
| **AC-6.3: Neon Button** | | | |
| AC-6.3.1: 4 variants | Data Models: NeonButtonProps | variant prop | UI test: All variants render |
| AC-6.3.2: 3 sizes | Data Models: NeonButtonProps | size prop | UI test: Size differences |
| AC-6.3.3: Glow on press | Workflows: Button Interaction | Reanimated animation | Visual test: Glow intensifies |
| AC-6.3.4: Haptic feedback | APIs: triggerHaptic() | expo-haptics | Integration test: Haptic fires |
| AC-6.3.5: Loading state | Data Models: NeonButtonProps | loading prop | UI test: Spinner shows |
| AC-6.3.6: Disabled state | Data Models: NeonButtonProps | disabled prop | UI test: Opacity reduced |
| AC-6.3.7: Custom accent color | Data Models: NeonButtonProps | accentColor prop | UI test: Color applies |
| AC-6.3.8: Touch target size | Non-Functional: Accessibility | minHeight: 44, minWidth: 44 | UI test: Touch target >= 44 |
| AC-6.3.9: Screen reader | Non-Functional: Accessibility | accessibilityLabel | Accessibility test: VoiceOver reads |
| **AC-6.4: Cosmic Card** | | | |
| AC-6.4.1: Translucent background | Services: CosmicCard | backgroundColor with opacity | Visual test: Translucency |
| AC-6.4.2: Blur effect | Data Models: CosmicCardProps | expo-blur | Visual test: Blur renders |
| AC-6.4.3: 3 elevations | Data Models: Elevation | elevation prop | Visual test: Shadow differences |
| AC-6.4.4: Glow border | Data Models: CosmicCardProps | glowBorder prop | Visual test: Glow border |
| AC-6.4.5: Header/footer sections | Data Models: CosmicCardProps | header, footer props | UI test: Sections render |
| AC-6.4.6: Pressable variant | Data Models: CosmicCardProps | onPress prop | UI test: onPress fires |
| AC-6.4.7: Nested cards | Services: CosmicCard | Nested rendering | UI test: Card in card works |
| AC-6.4.8: Render performance | Performance: Component Render | Performance monitor | Performance test: < 100ms |
| **AC-6.5: Transitions** | | | |
| AC-6.5.1: Fade transition | APIs: TRANSITIONS | createFadeTransition() | Animation test: Fades correctly |
| AC-6.5.2: Slide transitions | APIs: TRANSITIONS | createSlideTransition() | Animation test: 4 directions |
| AC-6.5.3: Scale transition | APIs: TRANSITIONS | createScaleTransition() | Animation test: Scales |
| AC-6.5.4: Navigation integration | Services: transitions.ts | React Navigation config | Integration test: Transitions apply |
| AC-6.5.5: Shared element | APIs: TRANSITIONS | sharedElementId | E2E test: Shared element animates |
| AC-6.5.6: Reduce motion | Non-Functional: Accessibility | AccessibilityInfo | Integration test: Respects setting |
| AC-6.5.7: 60 FPS | Performance: Animation Frame Rate | Performance monitor | Performance test: FPS tracking |
| AC-6.5.8: Reusable presets | APIs: ANIMATION_PRESETS | Exported presets | Unit test: Presets available |
| **AC-6.6: Loading States** | | | |
| AC-6.6.1: 5 skeleton types | Data Models: SkeletonLoaderProps | type prop | UI test: All types render |
| AC-6.6.2: Shimmer animation | Workflows: Loading State | Reanimated loop | Visual test: Shimmer effect |
| AC-6.6.3: CosmicSpinner | Services: CosmicSpinner | Rotating animation | Visual test: Spinner rotates |
| AC-6.6.4: Crossfade transition | Workflows: Skeleton to Content | Fade animation | Animation test: Smooth transition |
| AC-6.6.5: Layout matching | Services: SkeletonLoader | Custom dimensions | UI test: Skeleton matches content |
| AC-6.6.6: Timeout handling | Workflows: Loading State | 10s timeout | Integration test: Error after timeout |
| AC-6.6.7: Component library | Services: SkeletonLoader | Multiple skeleton types | Unit test: All components available |
| AC-6.6.8: 60 FPS shimmer | Performance: Shimmer Animation | Performance monitor | Performance test: FPS tracking |
| **AC-6.7: Haptics** | | | |
| AC-6.7.1: 7 patterns | APIs: triggerHaptic() | HapticPattern type | Unit test: All patterns available |
| AC-6.7.2: Device support check | APIs: isHapticsAvailable() | expo-haptics | Unit test: Check returns boolean |
| AC-6.7.3: System settings | APIs: triggerHaptic() | System check | Integration test: Respects settings |
| AC-6.7.4: Latency | Performance: Haptic Latency | Performance monitor | Performance test: < 50ms |
| AC-6.7.5: Debounce | Performance: Optimizations | Debounce logic | Unit test: Spam prevented |
| AC-6.7.6: Fallback | Workflows: Button Interaction | Graceful degradation | Integration test: No crash if unavailable |
| AC-6.7.7: Component integration | Services: All interactive components | NeonButton, etc. | Integration test: Haptics on all buttons |
| AC-6.7.8: Documentation | -- | Pattern usage guide | Manual review |

## Risks, Assumptions, Open Questions

### Risks

| Risk ID | Description | Probability | Impact | Mitigation Strategy | Owner |
|---------|-------------|-------------|--------|---------------------|-------|
| R-6.1 | Animations cause performance issues on low-end devices | Medium | High | Test on low-end Android, provide "reduce motion" option | Story 6.5 |
| R-6.2 | Blur effects not supported on older Android versions | Low | Medium | Fallback to solid background with opacity | Story 6.4 |
| R-6.3 | Color contrast fails WCAG AA on some combinations | Low | High | Automated contrast checking in CI, manual review | Story 6.1 |
| R-6.4 | Haptics not available on all devices | Medium | Low | Graceful fallback, visual feedback only | Story 6.7 |
| R-6.5 | Galaxy background image too large (>1MB) | Low | Medium | Optimize image, provide fallback gradient | Story 6.2 |
| R-6.6 | Custom transitions conflict with React Navigation updates | Low | Medium | Version lock React Navigation, test upgrades | Story 6.5 |
| R-6.7 | Design system becomes inconsistent as team grows | Medium | Medium | Enforce through code review, component library docs | All stories |

### Assumptions

| Assumption ID | Description | Validation Method | Impact if Invalid |
|---------------|-------------|-------------------|-------------------|
| A-6.1 | Users prefer dark theme (no light theme needed in MVP) | User testing, analytics | May need to add light theme |
| A-6.2 | 8 accent colors are sufficient for personalization | User feedback | May need to expand palette |
| A-6.3 | Galaxy aesthetic resonates with target audience | User testing | May need design refresh |
| A-6.4 | React Native Reanimated performs well on target devices | Performance testing | May need to simplify animations |
| A-6.5 | Existing galaxybackground.png is high enough quality | Visual review | May need higher res asset |
| A-6.6 | Haptics enhance UX (not annoying) | User testing | May need to make haptics opt-in |
| A-6.7 | Design system reduces development time | Development velocity tracking | May need simpler components |

### Open Questions

| Question ID | Description | Importance | Resolution Needed By | Proposed Resolution |
|-------------|-------------|------------|---------------------|---------------------|
| Q-6.1 | Should we support user-uploaded background images? | Low | Phase 2 | **Decision**: Not in MVP, custom backgrounds in Phase 2 |
| Q-6.2 | Should haptics be enabled by default or opt-in? | Medium | Story 6.7 | **Decision**: Enabled by default, disable in settings |
| Q-6.3 | Should we use Lottie for complex animations? | Low | Phase 2 | **Decision**: Not in MVP, SVG/Reanimated sufficient |
| Q-6.4 | Should buttons have sound effects? | Low | Phase 2 | **Decision**: No sounds in MVP, haptics only |
| Q-6.5 | Should we support custom font families? | Low | Phase 2 | **Decision**: System fonts in MVP, custom fonts Phase 2 |
| Q-6.6 | Should shimmer direction be customizable? | Low | Story 6.6 | **Decision**: Left-to-right only in MVP |
| Q-6.7 | Should we provide dark/light theme toggle? | Medium | Phase 2 | **Decision**: Dark theme only in MVP |

## Test Strategy Summary

### Unit Tests

**Target Coverage**: 80% minimum

**Key Test Areas:**
1. **Color Utilities** (Story 6.1):
   - hexToRgba conversion accuracy
   - adjustBrightness calculation
   - Contrast ratio calculation
   - Variant generation (light, dark, glow)

2. **Haptic System** (Story 6.7):
   - Pattern mapping correctness
   - Device support detection
   - Debounce logic
   - Graceful degradation

3. **Animation Configs** (Story 6.5):
   - Transition config generation
   - Preset availability
   - Easing function application

4. **Component Props** (All):
   - Prop validation
   - Default values
   - Type checking

### Integration Tests

**Target**: All component interactions

**Key Integration Scenarios:**
1. **Theme Application** (Story 6.1):
   - User selects accent color → Theme updates → Components re-render with new color

2. **Button Interaction** (Story 6.3):
   - User taps button → Haptic fires → Glow animates → onPress executes

3. **Screen Transition** (Story 6.5):
   - Navigate to screen → Custom transition applies → Animation completes

4. **Loading States** (Story 6.6):
   - Data fetch starts → Skeleton displays → Data arrives → Crossfade to content

5. **Accessibility** (All):
   - VoiceOver navigation through all components
   - Reduced motion setting respected

### UI/Component Tests

**Target**: All components render correctly

**Testing Framework**: React Native Testing Library

**Key UI Tests:**
1. **GalaxyBackground**:
   - All intensity levels render
   - Children render on top
   - Safe area respected

2. **NeonButton**:
   - All variants render correctly
   - All sizes have correct dimensions
   - Loading state shows spinner
   - Disabled state has reduced opacity

3. **CosmicCard**:
   - Elevation shadows visible
   - Blur effect applies
   - Glow border renders
   - Header/footer sections display

4. **SkeletonLoader**:
   - All skeleton types render
   - Shimmer animation runs
   - Dimensions match props

5. **CosmicSpinner**:
   - Spinner rotates continuously
   - Size prop applies correctly

### Visual Regression Tests

**Tool**: Percy or similar

**Key Visual Tests:**
1. Color palette swatches
2. Button variants and states
3. Card elevations
4. Skeleton loader types
5. Gradient rendering
6. Shadow/glow effects

### Performance Tests

**Target Metrics:**
- All animations: 60 FPS
- Screen transitions: < 300ms
- Haptic latency: < 50ms
- Component render: < 100ms

**Key Performance Tests:**
1. Animation frame rate monitoring (React Native Performance)
2. Memory profiling during animations
3. Render time benchmarks for complex components
4. Scroll performance with GalaxyBackground
5. Haptic trigger latency measurement

### Accessibility Tests

**Requirements:**
- WCAG AA compliance
- Screen reader support
- Keyboard navigation (web)
- Reduced motion support

**Key Accessibility Tests:**
1. Automated contrast checking (all color combos)
2. VoiceOver/TalkBack navigation
3. Touch target size validation (>= 44x44)
4. Focus indicator visibility
5. Reduced motion fallback

## References

- [Source: docs/epics.md#Epic-6] Epic 6 story definitions
- [Source: docs/Twinship PRD.md#Technical-Architecture] Design system requirements
- [Source: docs/tech-spec-epic-1.md] Architecture patterns
- [Source: docs/ui-component-architecture.md] Component design patterns
- [Source: docs/performance-optimization-plan.md] Performance best practices

## Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2025-11-18 | Claude (BMAD) | Initial draft created following Epic 1 & 2 format |

## Appendix

### Color Palette Visual Reference

**Accent Colors:**
- **nebula-rose**: #FF6B9D - Soft pink with cosmic energy
- **stellar-blue**: #00D4FF - Bright cyan like distant stars
- **orbit-sage**: #8FD14F - Fresh green orbital glow
- **solar-amber**: #FFB347 - Warm solar flare orange
- **celestial-indigo**: #6366F1 - Deep space indigo
- **comet-coral**: #FF7F50 - Vibrant coral comet tail
- **aurora-teal**: #00CED1 - Northern lights teal
- **meteor-copper**: #D4AF37 - Metallic copper meteor

**Base Colors:**
- **deep-space**: #0B0B1E - Primary background
- **cosmic-void**: #060612 - Deeper background
- **stardust**: #E5E7EB - Primary text
- **moonlight**: #9CA3AF - Secondary text
- **nebula-mist**: #374151 - Border/divider

### Animation Timing Reference

**Micro-interactions (< 200ms):**
- Button press feedback
- Haptic trigger
- Focus state change

**Interactions (200-400ms):**
- Button glow animation
- Card press effect
- Skeleton shimmer cycle

**Transitions (300-500ms):**
- Screen navigation
- Modal appearance
- Content crossfade

**Ambient (> 1000ms):**
- Background star twinkling
- Idle animations
- Loading spinner

### Component Usage Examples

**Common Patterns:**

```tsx
// Game screen with full design system
<GalaxyBackground intensity="normal" animated>
  <SafeAreaView>
    <CosmicCard elevation={2} blur glowBorder accentColor="stellar-blue">
      <Text className="text-2xl font-bold text-stardust">Game Title</Text>
      <Text className="text-moonlight">Instructions go here</Text>

      <NeonButton
        variant="primary"
        size="large"
        accentColor="stellar-blue"
        onPress={handleStart}
        hapticFeedback="medium"
      >
        Start Game
      </NeonButton>
    </CosmicCard>
  </SafeAreaView>
</GalaxyBackground>

// Loading state
<GalaxyBackground>
  <View className="flex-1 justify-center items-center">
    {loading ? (
      <SkeletonLoader type="card" count={3} shimmer />
    ) : (
      <CosmicCard>
        {/* Content */}
      </CosmicCard>
    )}
  </View>
</GalaxyBackground>

// Navigation with custom transition
<Stack.Navigator
  screenOptions={{
    ...TRANSITIONS.fade,
    headerShown: false,
  }}
>
  <Stack.Screen name="Game" component={GameScreen} />
</Stack.Navigator>
```

---

## Epic 6 Tech Spec Complete ✅

**Document Status**: Draft → Ready for Review
**Next Steps**:
1. Create all 7 story files in `/docs/stories/`
2. Update sprint-status.yaml: `epic-6: backlog` → `epic-6: contexted`
3. Begin Story 6.1 implementation (Color System)
4. Use this spec as authoritative reference during development

**Document Approvers**:
- [ ] Product Manager (Ashley)
- [ ] Design Lead
- [ ] Tech Lead
- [ ] Accessibility Lead

**Last Updated**: 2025-11-18
