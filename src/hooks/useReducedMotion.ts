/**
 * useReducedMotion Hook
 *
 * React hook to detect if the user has enabled "Reduce Motion" accessibility setting.
 * Used to disable animations for users who prefer reduced motion.
 */

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Hook to check if the user has enabled reduced motion in system settings
 *
 * @returns boolean - true if reduced motion is enabled, false otherwise
 *
 * @example
 * const MyComponent = () => {
 *   const reducedMotion = useReducedMotion();
 *
 *   return (
 *     <View>
 *       {!reducedMotion && <AnimatedComponent />}
 *     </View>
 *   );
 * };
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check initial state
    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => setReducedMotion(enabled ?? false))
      .catch(() => setReducedMotion(false)); // Default to false on error

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion
    );

    // Cleanup listener on unmount
    return () => subscription.remove();
  }, []);

  return reducedMotion;
}
