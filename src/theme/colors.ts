/**
 * Galaxy Theme Color System
 *
 * Centralized color palette and utilities for the Twinship app.
 * All colors follow a galaxy/cosmic theme with accessibility in mind.
 */

import type {
  GalaxyAccentColor,
  ColorWithVariants,
  RGB,
  WCAGLevel,
} from './types';

// Re-export types for external use
export type { GalaxyAccentColor, ColorWithVariants, RGB, WCAGLevel };

/**
 * Accent Colors (User-Selectable)
 *
 * These 8 colors are available for users to personalize their app experience.
 * Each color is carefully chosen to work well on dark backgrounds.
 */
export const ACCENT_COLORS: Record<GalaxyAccentColor, string> = {
  'nebula-rose': '#FF6B9D',
  'stellar-blue': '#00D4FF',
  'orbit-sage': '#8FD14F',
  'solar-amber': '#FFB347',
  'celestial-indigo': '#7073FE',  // Adjusted for WCAG AA compliance (5.16:1 contrast)
  'comet-coral': '#FF7F50',
  'aurora-teal': '#00CED1',
  'meteor-copper': '#D4AF37',
};

/**
 * Base UI Colors
 *
 * Foundational colors for backgrounds, text, and borders.
 */
export const BASE_COLORS = {
  'deep-space': '#0B0B1E',      // Background dark
  'cosmic-void': '#060612',      // Background darker
  'stardust': '#E5E7EB',         // Text primary
  'moonlight': '#9CA3AF',        // Text secondary
  'nebula-mist': '#374151',      // Border/divider
};

/**
 * Semantic Colors
 *
 * Colors for state and feedback (success, error, warning, info).
 */
export const SEMANTIC_COLORS = {
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

/**
 * All colors combined for easy access
 */
export const GALAXY_COLORS = {
  ...ACCENT_COLORS,
  ...BASE_COLORS,
  ...SEMANTIC_COLORS,
};

// ============================================================================
// Color Utility Functions
// ============================================================================

/**
 * Convert hex color to RGB components
 */
function hexToRgb(hex: string): RGB {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Handle shorthand hex (#FFF -> #FFFFFF)
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(char => char + char).join('')
    : cleanHex;

  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);

  return { r, g, b };
}

/**
 * Convert RGB components to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Convert hex color to RGBA string
 *
 * @param hex - Hex color (e.g., "#FF6B9D" or "#FFF")
 * @param alpha - Alpha channel (0-1)
 * @returns RGBA string (e.g., "rgba(255, 107, 157, 0.5)")
 *
 * @example
 * hexToRgba('#FF6B9D', 0.5) // "rgba(255, 107, 157, 0.5)"
 * hexToRgba('#FFF', 1) // "rgba(255, 255, 255, 1)"
 */
export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Adjust brightness of a color
 *
 * @param hex - Hex color to adjust
 * @param amount - Amount to adjust (-1 to 1, negative darkens, positive lightens)
 * @returns New hex color
 *
 * @example
 * adjustBrightness('#FF6B9D', 0.2) // Lighter version
 * adjustBrightness('#FF6B9D', -0.2) // Darker version
 */
export function adjustBrightness(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);

  const adjust = (value: number) => {
    const adjusted = value + (amount * 255);
    return Math.max(0, Math.min(255, Math.round(adjusted)));
  };

  return rgbToHex(adjust(r), adjust(g), adjust(b));
}

/**
 * Get relative luminance of a color (WCAG formula)
 * Used for contrast ratio calculations
 */
function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);

  const toLinear = (channel: number) => {
    const sRGB = channel / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  };

  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculate contrast ratio between two colors (WCAG formula)
 */
function calculateContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color combination meets WCAG contrast requirement
 *
 * @param foreground - Foreground color (text)
 * @param background - Background color
 * @param level - WCAG level ('AA' = 4.5:1, 'AAA' = 7:1)
 * @returns True if contrast requirement is met
 *
 * @example
 * meetsContrastRequirement('#FFFFFF', '#000000') // true (21:1 ratio)
 * meetsContrastRequirement('#CCCCCC', '#DDDDDD') // false (insufficient contrast)
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: WCAGLevel = 'AA'
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  const threshold = level === 'AAA' ? 7 : 4.5;

  return ratio >= threshold;
}

/**
 * Create a glow color variant with opacity
 *
 * @param baseColor - Base hex color
 * @param opacity - Opacity level (0-1), defaults to 0.3
 * @returns RGBA string for glow effect
 *
 * @example
 * getGlowColor('#FF6B9D') // "rgba(255, 107, 157, 0.3)"
 * getGlowColor('#FF6B9D', 0.5) // "rgba(255, 107, 157, 0.5)"
 */
export function getGlowColor(baseColor: string, opacity: number = 0.3): string {
  return hexToRgba(baseColor, opacity);
}

/**
 * Get accent color with all variants (light, base, dark, glow)
 *
 * @param name - Accent color name
 * @returns Color with all variants
 *
 * @example
 * const color = getAccentColor('stellar-blue');
 * console.log(color.base); // "#00D4FF"
 * console.log(color.light); // Lighter version
 * console.log(color.dark); // Darker version
 * console.log(color.glow); // "rgba(0, 212, 255, 0.3)"
 */
export function getAccentColor(name: GalaxyAccentColor): ColorWithVariants {
  const base = ACCENT_COLORS[name];

  return {
    base,
    light: adjustBrightness(base, 0.2),    // 20% lighter
    dark: adjustBrightness(base, -0.2),    // 20% darker
    glow: hexToRgba(base, 0.3),            // 30% opacity for glow
  };
}

/**
 * Export relative luminance function for testing
 */
export { getRelativeLuminance, calculateContrastRatio };
