/**
 * Galaxy Theme Gradient System
 *
 * Predefined cosmic gradients for use throughout the app.
 * Compatible with expo-linear-gradient.
 */

import type { GalaxyGradient, GradientDirection } from './types';

/**
 * Predefined Galaxy Gradients
 *
 * Each gradient includes:
 * - colors: Array of hex colors for the gradient
 * - start: Starting point coordinates (0-1 range)
 * - end: Ending point coordinates (0-1 range)
 */
export const GALAXY_GRADIENTS: Record<string, GalaxyGradient> = {
  /**
   * Cosmic Gradient
   * Deep purple to pink diagonal - evokes nebula clouds
   */
  cosmic: {
    colors: ['#6366F1', '#8B5CF6', '#EC4899'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  /**
   * Nebula Gradient
   * Pink to coral to amber - warm cosmic colors
   */
  nebula: {
    colors: ['#FF6B9D', '#FF7F50', '#FFB347'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },

  /**
   * Aurora Gradient
   * Blue to teal to green - northern lights inspired
   */
  aurora: {
    colors: ['#00D4FF', '#00CED1', '#8FD14F'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },

  /**
   * Stellar Gradient
   * Blue to indigo - deep space vibes
   */
  stellar: {
    colors: ['#00D4FF', '#6366F1'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },

  /**
   * Sunset Gradient
   * Amber to copper - warm sunset on alien world
   */
  sunset: {
    colors: ['#FFB347', '#D4AF37'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

/**
 * Create a custom gradient with specified colors and direction
 *
 * @param colors - Array of hex color strings
 * @param direction - Gradient direction
 * @returns GalaxyGradient object
 *
 * @example
 * const gradient = createGradient(['#FF0000', '#00FF00'], 'vertical');
 * // Use with expo-linear-gradient:
 * <LinearGradient colors={gradient.colors} start={gradient.start} end={gradient.end} />
 */
export function createGradient(
  colors: string[],
  direction: GradientDirection = 'vertical'
): GalaxyGradient {
  const directions = {
    horizontal: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
    vertical: { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
    'diagonal-down': { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
    'diagonal-up': { start: { x: 0, y: 1 }, end: { x: 1, y: 0 } },
  };

  return {
    colors,
    ...directions[direction],
  };
}

/**
 * Get gradient by name
 *
 * @param name - Gradient name
 * @returns GalaxyGradient object or undefined if not found
 */
export function getGradient(name: string): GalaxyGradient | undefined {
  return GALAXY_GRADIENTS[name];
}
