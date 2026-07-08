/**
 * Galaxy Theme System
 *
 * Centralized barrel export for all theme-related utilities.
 */

// Type exports
export type {
  GalaxyAccentColor,
  GalaxyBaseColor,
  GalaxySemanticColor,
  GalaxyColor,
  ColorWithVariants,
  RGB,
  GalaxyGradient,
  GradientDirection,
  WCAGLevel,
} from './types';

// Color exports
export {
  ACCENT_COLORS,
  BASE_COLORS,
  SEMANTIC_COLORS,
  GALAXY_COLORS,
  hexToRgba,
  adjustBrightness,
  getGlowColor,
  getAccentColor,
  meetsContrastRequirement,
  getRelativeLuminance,
  calculateContrastRatio,
} from './colors';

// Gradient exports
export {
  GALAXY_GRADIENTS,
  createGradient,
  getGradient,
} from './gradients';

// Shadow/Elevation exports
export type { ElevationStyle } from './shadows';
export { ELEVATIONS } from './shadows';

// Animation exports
export { ANIMATION_PRESETS, EASING_CURVES } from './animations';

// Haptic exports
export type { HapticPattern } from './haptics';
export {
  triggerHaptic,
  setupHaptics,
  isHapticsAvailable,
  resetHaptics,
} from './haptics';
