# Story 6.7: Haptic Feedback System

**Epic**: Epic 6 - Galaxy Visual Design System
**Story ID**: 6.7
**Status**: Drafted
**Effort**: Small (2-3 hours)
**Dependencies**: None (foundational story)

---

## User Story

**As a** user
**I want** tactile feedback for interactions
**So that** the app feels responsive and satisfying to use

---

## Acceptance Criteria

1. **Haptic Patterns**
   - Define 7 haptic patterns: light, medium, heavy, success, warning, error, selection
   - Each pattern has distinct feel and intensity
   - Patterns use Expo Haptics API

2. **Haptic Utility**
   - Create `triggerHaptic(pattern)` function
   - Check device support before triggering
   - Respect system haptic settings
   - Graceful fallback if haptics unavailable

3. **Performance**
   - Haptic latency < 50ms from trigger
   - Debounce rapid triggers (prevent spam)
   - No performance impact on app

4. **Integration**
   - Easy integration with all interactive components
   - Works with NeonButton, CosmicCard, and other pressables
   - Optional haptic feedback via prop

5. **Accessibility**
   - Respects system haptic settings
   - Provides non-visual feedback
   - Works on supported devices (iOS, Android)

6. **Documentation**
   - Pattern usage guide
   - When to use each pattern
   - Best practices

---

## Implementation Details

### Files to Create/Modify

**New Files:**
- `src/theme/haptics.ts` - Haptic system
- `src/theme/__tests__/haptics.test.ts` - Tests

**Modified Files:**
- `src/theme/index.ts` - Export haptic utilities

### Haptic Types and Patterns

```typescript
// src/theme/haptics.ts
import * as Haptics from 'expo-haptics';

export type HapticPattern =
  | 'light'      // Light tap (like toggling switch)
  | 'medium'     // Medium impact (like button press)
  | 'heavy'      // Heavy impact (like deletion or important action)
  | 'success'    // Success notification
  | 'warning'    // Warning notification
  | 'error'      // Error notification
  | 'selection'; // Selection change (like scrolling picker)

interface HapticConfig {
  type: Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType;
  method: 'impact' | 'notification' | 'selection';
}

const HAPTIC_PATTERNS: Record<HapticPattern, HapticConfig> = {
  light: {
    type: Haptics.ImpactFeedbackStyle.Light,
    method: 'impact',
  },
  medium: {
    type: Haptics.ImpactFeedbackStyle.Medium,
    method: 'impact',
  },
  heavy: {
    type: Haptics.ImpactFeedbackStyle.Heavy,
    method: 'impact',
  },
  success: {
    type: Haptics.NotificationFeedbackType.Success,
    method: 'notification',
  },
  warning: {
    type: Haptics.NotificationFeedbackType.Warning,
    method: 'notification',
  },
  error: {
    type: Haptics.NotificationFeedbackType.Error,
    method: 'notification',
  },
  selection: {
    type: null, // Uses selectionAsync()
    method: 'selection',
  },
};
```

### Haptic Utility Functions

```typescript
let isHapticAvailable: boolean | null = null;
let lastHapticTime = 0;
const HAPTIC_DEBOUNCE_MS = 50; // Minimum time between haptics

/**
 * Check if haptic feedback is available on this device
 */
export async function isHapticsAvailable(): Promise<boolean> {
  if (isHapticAvailable !== null) {
    return isHapticAvailable;
  }

  try {
    // Expo Haptics will throw if not supported
    await Haptics.selectionAsync();
    isHapticAvailable = true;
  } catch {
    isHapticAvailable = false;
  }

  return isHapticAvailable;
}

/**
 * Trigger a haptic feedback pattern
 * @param pattern The haptic pattern to trigger
 */
export async function triggerHaptic(
  pattern: HapticPattern = 'medium'
): Promise<void> {
  // Debounce to prevent spam
  const now = Date.now();
  if (now - lastHapticTime < HAPTIC_DEBOUNCE_MS) {
    return;
  }
  lastHapticTime = now;

  // Check device support
  const available = await isHapticsAvailable();
  if (!available) {
    return; // Graceful fallback - do nothing
  }

  const config = HAPTIC_PATTERNS[pattern];

  try {
    switch (config.method) {
      case 'impact':
        await Haptics.impactAsync(config.type as Haptics.ImpactFeedbackStyle);
        break;
      case 'notification':
        await Haptics.notificationAsync(config.type as Haptics.NotificationFeedbackType);
        break;
      case 'selection':
        await Haptics.selectionAsync();
        break;
    }
  } catch (error) {
    // Silently fail - haptics are optional
    console.warn('Haptic feedback failed:', error);
  }
}

/**
 * Setup haptics (check availability once at app start)
 */
export async function setupHaptics(): Promise<void> {
  await isHapticsAvailable();
}

/**
 * Reset haptic availability check (useful for testing)
 */
export function resetHaptics(): void {
  isHapticAvailable = null;
  lastHapticTime = 0;
}
```

### Usage Guide

```typescript
/**
 * Haptic Pattern Usage Guide
 *
 * light: Subtle interactions
 *   - Toggling switches
 *   - Small UI changes
 *   - Light taps
 *
 * medium: Standard interactions
 *   - Button presses
 *   - Navigation
 *   - Opening modals
 *
 * heavy: Important interactions
 *   - Deletion confirmations
 *   - Completing major tasks
 *   - Significant state changes
 *
 * success: Positive feedback
 *   - Task completion
 *   - Successful submission
 *   - Achievement unlocked
 *
 * warning: Caution feedback
 *   - Approaching limit
 *   - Potential issue
 *   - Non-critical alert
 *
 * error: Negative feedback
 *   - Failed submission
 *   - Invalid input
 *   - Critical error
 *
 * selection: Continuous feedback
 *   - Scrolling through picker
 *   - Slider adjustments
 *   - List scrolling (sparingly)
 */
```

### Integration Example

```tsx
// In NeonButton component
import { triggerHaptic } from '@/theme/haptics';

const handlePress = () => {
  triggerHaptic(hapticFeedback); // 'medium' by default
  onPress();
};

// In a form submission
const handleSubmit = async () => {
  try {
    await submitForm();
    triggerHaptic('success');
    navigate('Success');
  } catch (error) {
    triggerHaptic('error');
    showError(error);
  }
};

// In a delete action
const handleDelete = async () => {
  triggerHaptic('heavy');
  await deleteItem();
  triggerHaptic('success');
};
```

---

## Technical Approach

### 1. Device Support Check

```typescript
// Check once at app start, cache result
let isHapticAvailable: boolean | null = null;

export async function isHapticsAvailable(): Promise<boolean> {
  if (isHapticAvailable !== null) {
    return isHapticAvailable;
  }

  try {
    await Haptics.selectionAsync();
    isHapticAvailable = true;
  } catch {
    isHapticAvailable = false;
  }

  return isHapticAvailable;
}
```

### 2. Debouncing

```typescript
// Prevent haptic spam from rapid interactions
let lastHapticTime = 0;
const HAPTIC_DEBOUNCE_MS = 50;

export async function triggerHaptic(pattern: HapticPattern): Promise<void> {
  const now = Date.now();
  if (now - lastHapticTime < HAPTIC_DEBOUNCE_MS) {
    return; // Too soon, skip this haptic
  }
  lastHapticTime = now;

  // ... trigger haptic
}
```

### 3. Error Handling

```typescript
try {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
} catch (error) {
  // Silently fail - haptics are optional UX enhancement
  // Don't block UI or show error to user
  console.warn('Haptic feedback failed:', error);
}
```

---

## Testing Requirements

### Unit Tests

```typescript
import * as Haptics from 'expo-haptics';
import {
  triggerHaptic,
  isHapticsAvailable,
  setupHaptics,
  resetHaptics,
} from '../haptics';

jest.mock('expo-haptics');

describe('Haptics System', () => {
  beforeEach(() => {
    resetHaptics();
    jest.clearAllMocks();
  });

  describe('isHapticsAvailable', () => {
    it('returns true when haptics are supported', async () => {
      jest.spyOn(Haptics, 'selectionAsync').mockResolvedValue();

      const available = await isHapticsAvailable();
      expect(available).toBe(true);
    });

    it('returns false when haptics are not supported', async () => {
      jest.spyOn(Haptics, 'selectionAsync').mockRejectedValue(new Error());

      const available = await isHapticsAvailable();
      expect(available).toBe(false);
    });

    it('caches result for subsequent calls', async () => {
      const spy = jest.spyOn(Haptics, 'selectionAsync').mockResolvedValue();

      await isHapticsAvailable();
      await isHapticsAvailable();
      await isHapticsAvailable();

      expect(spy).toHaveBeenCalledTimes(1); // Only called once
    });
  });

  describe('triggerHaptic', () => {
    beforeEach(async () => {
      // Mock haptics as available
      jest.spyOn(Haptics, 'selectionAsync').mockResolvedValue();
      await setupHaptics();
    });

    it('triggers light impact haptic', async () => {
      const spy = jest.spyOn(Haptics, 'impactAsync').mockResolvedValue();

      await triggerHaptic('light');
      expect(spy).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('triggers medium impact haptic', async () => {
      const spy = jest.spyOn(Haptics, 'impactAsync').mockResolvedValue();

      await triggerHaptic('medium');
      expect(spy).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });

    it('triggers success notification haptic', async () => {
      const spy = jest.spyOn(Haptics, 'notificationAsync').mockResolvedValue();

      await triggerHaptic('success');
      expect(spy).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
    });

    it('triggers selection haptic', async () => {
      const spy = jest.spyOn(Haptics, 'selectionAsync').mockResolvedValue();

      await triggerHaptic('selection');
      expect(spy).toHaveBeenCalled();
    });

    it('does not trigger haptic on unsupported device', async () => {
      resetHaptics();
      jest.spyOn(Haptics, 'selectionAsync').mockRejectedValue(new Error());
      await setupHaptics();

      const spy = jest.spyOn(Haptics, 'impactAsync');

      await triggerHaptic('medium');
      expect(spy).not.toHaveBeenCalled();
    });

    it('debounces rapid haptic triggers', async () => {
      const spy = jest.spyOn(Haptics, 'impactAsync').mockResolvedValue();

      await triggerHaptic('medium');
      await triggerHaptic('medium');
      await triggerHaptic('medium');

      expect(spy).toHaveBeenCalledTimes(1); // Only first one triggers
    });

    it('allows haptic after debounce period', async () => {
      const spy = jest.spyOn(Haptics, 'impactAsync').mockResolvedValue();

      await triggerHaptic('medium');
      await new Promise(resolve => setTimeout(resolve, 60)); // Wait > 50ms
      await triggerHaptic('medium');

      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('handles errors gracefully', async () => {
      jest.spyOn(Haptics, 'impactAsync').mockRejectedValue(new Error('Haptic failed'));

      // Should not throw
      await expect(triggerHaptic('medium')).resolves.not.toThrow();
    });
  });
});
```

### Integration Tests

```typescript
describe('Haptic Integration', () => {
  it('works with NeonButton', async () => {
    const spy = jest.spyOn(Haptics, 'impactAsync').mockResolvedValue();

    const { getByText } = render(
      <NeonButton
        variant="primary"
        size="medium"
        onPress={() => {}}
        hapticFeedback="medium"
      >
        Press Me
      </NeonButton>
    );

    fireEvent.press(getByText('Press Me'));

    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });
  });
});
```

### Performance Tests

```typescript
describe('Haptic Performance', () => {
  it('triggers haptic in under 50ms', async () => {
    jest.spyOn(Haptics, 'impactAsync').mockResolvedValue();

    const startTime = performance.now();
    await triggerHaptic('medium');
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(50);
  });
});
```

---

## Definition of Done

- [ ] Haptic system created with 7 patterns
- [ ] `triggerHaptic()` function implemented
- [ ] Device support checking
- [ ] Debounce logic to prevent spam
- [ ] Graceful fallback for unsupported devices
- [ ] Integration with NeonButton and other components
- [ ] Unit tests written and passing (80%+ coverage)
- [ ] Performance tests confirm < 50ms latency
- [ ] Documentation with usage guide
- [ ] Haptics exported from theme/index.ts
- [ ] Used in at least 5 interactive components
- [ ] Code reviewed and approved
- [ ] TypeScript compiles with no errors

---

## Related Stories

- **Depends On**: None (foundational)
- **Blocks**: 6.3 (NeonButton uses haptics)
- **Related**: All interactive components benefit from haptics

---

## Notes

- Haptics should enhance UX, not annoy users
- Use sparingly - not every interaction needs haptic feedback
- Different patterns help communicate meaning (success vs error)
- Debouncing prevents haptic spam from rapid taps
- Always gracefully degrade on unsupported devices
- Respect user's system haptic settings
- Test on real devices - simulator doesn't show haptic intensity
- Consider adding haptic settings toggle in user preferences (Phase 2)

---

**Created**: 2025-11-18
**Author**: Claude (BMAD Method)
**Status**: Drafted
