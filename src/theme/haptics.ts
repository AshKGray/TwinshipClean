/**
 * Haptic Feedback System
 * Story 6.7: Haptic Feedback System
 *
 * Provides tactile feedback for user interactions across the app.
 * Includes device support checking, debouncing, and graceful degradation.
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticPattern =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

interface HapticConfig {
  type: Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType | null;
  method: 'impact' | 'notification' | 'selection';
}

/**
 * Haptic pattern configurations
 */
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
    type: null,
    method: 'selection',
  },
};

let isHapticAvailable: boolean | null = null;
let lastHapticTime = 0;
const HAPTIC_DEBOUNCE_MS = 50;

/**
 * Check if haptic feedback is available on this device
 */
export async function isHapticsAvailable(): Promise<boolean> {
  if (isHapticAvailable !== null) {
    return isHapticAvailable;
  }

  // Haptics not available on web
  if (Platform.OS === 'web') {
    isHapticAvailable = false;
    return false;
  }

  try {
    await Haptics.selectionAsync();
    isHapticAvailable = true;
  } catch {
    isHapticAvailable = false;
  }

  return isHapticAvailable;
}

/**
 * Trigger a haptic feedback pattern
 *
 * @param pattern The haptic pattern to trigger
 *
 * @example
 * // Button press
 * triggerHaptic('medium');
 *
 * // Success feedback
 * triggerHaptic('success');
 *
 * // Selection change
 * triggerHaptic('selection');
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
    return;
  }

  const config = HAPTIC_PATTERNS[pattern];

  try {
    switch (config.method) {
      case 'impact':
        await Haptics.impactAsync(config.type as Haptics.ImpactFeedbackStyle);
        break;
      case 'notification':
        await Haptics.notificationAsync(
          config.type as Haptics.NotificationFeedbackType
        );
        break;
      case 'selection':
        await Haptics.selectionAsync();
        break;
    }
  } catch (error) {
    // Silently fail - haptics are optional UX enhancement
    if (__DEV__) {
      console.warn('Haptic feedback failed:', error);
    }
  }
}

/**
 * Setup haptics (check availability at app start)
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

/**
 * Haptic Pattern Usage Guide
 *
 * light: Subtle interactions
 *   - Toggling switches
 *   - Small UI changes
 *   - Light taps
 *
 * medium: Standard interactions (DEFAULT)
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
