/**
 * Galaxy Theme Type Definitions
 *
 * This file contains all TypeScript types and interfaces for the Twinship theme system.
 */

/**
 * Galaxy accent colors that users can select for personalization
 */
export type GalaxyAccentColor =
  | 'nebula-rose'
  | 'stellar-blue'
  | 'orbit-sage'
  | 'solar-amber'
  | 'celestial-indigo'
  | 'comet-coral'
  | 'aurora-teal'
  | 'meteor-copper';

/**
 * Base UI colors for consistent theming
 */
export type GalaxyBaseColor =
  | 'deep-space'
  | 'cosmic-void'
  | 'stardust'
  | 'moonlight'
  | 'nebula-mist';

/**
 * Semantic colors for state and feedback
 */
export type GalaxySemanticColor =
  | 'success'
  | 'error'
  | 'warning'
  | 'info';

/**
 * All available galaxy colors
 */
export type GalaxyColor = GalaxyAccentColor | GalaxyBaseColor | GalaxySemanticColor;

/**
 * Color with all variants (light, base, dark, glow)
 */
export interface ColorWithVariants {
  base: string;
  light: string;
  dark: string;
  glow: string;
}

/**
 * RGB color components
 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Gradient configuration for expo-linear-gradient
 */
export interface GalaxyGradient {
  colors: string[];
  start: { x: number; y: number };
  end: { x: number; y: number };
}

/**
 * Gradient direction options
 */
export type GradientDirection = 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up';

/**
 * WCAG compliance levels
 */
export type WCAGLevel = 'AA' | 'AAA';
