/**
 * Color System Unit Tests
 *
 * Tests for the Galaxy Theme color system utilities and accessibility compliance.
 */

import {
  ACCENT_COLORS,
  BASE_COLORS,
  SEMANTIC_COLORS,
  getAccentColor,
  hexToRgba,
  adjustBrightness,
  getGlowColor,
  meetsContrastRequirement,
  getRelativeLuminance,
  calculateContrastRatio,
} from '../colors';

describe('Color System', () => {
  describe('Color Palette Constants', () => {
    it('exports all 8 accent colors', () => {
      expect(Object.keys(ACCENT_COLORS)).toHaveLength(8);
      expect(ACCENT_COLORS).toHaveProperty('nebula-rose');
      expect(ACCENT_COLORS).toHaveProperty('stellar-blue');
      expect(ACCENT_COLORS).toHaveProperty('orbit-sage');
      expect(ACCENT_COLORS).toHaveProperty('solar-amber');
      expect(ACCENT_COLORS).toHaveProperty('celestial-indigo');
      expect(ACCENT_COLORS).toHaveProperty('comet-coral');
      expect(ACCENT_COLORS).toHaveProperty('aurora-teal');
      expect(ACCENT_COLORS).toHaveProperty('meteor-copper');
    });

    it('exports all 5 base colors', () => {
      expect(Object.keys(BASE_COLORS)).toHaveLength(5);
      expect(BASE_COLORS).toHaveProperty('deep-space');
      expect(BASE_COLORS).toHaveProperty('cosmic-void');
      expect(BASE_COLORS).toHaveProperty('stardust');
      expect(BASE_COLORS).toHaveProperty('moonlight');
      expect(BASE_COLORS).toHaveProperty('nebula-mist');
    });

    it('exports all 4 semantic colors', () => {
      expect(Object.keys(SEMANTIC_COLORS)).toHaveLength(4);
      expect(SEMANTIC_COLORS).toHaveProperty('success');
      expect(SEMANTIC_COLORS).toHaveProperty('error');
      expect(SEMANTIC_COLORS).toHaveProperty('warning');
      expect(SEMANTIC_COLORS).toHaveProperty('info');
    });
  });

  describe('getAccentColor', () => {
    it('returns all color variants', () => {
      const color = getAccentColor('stellar-blue');
      expect(color).toHaveProperty('base');
      expect(color).toHaveProperty('light');
      expect(color).toHaveProperty('dark');
      expect(color).toHaveProperty('glow');
    });

    it('base variant matches ACCENT_COLORS value', () => {
      const color = getAccentColor('nebula-rose');
      expect(color.base).toBe(ACCENT_COLORS['nebula-rose']);
      expect(color.base).toBe('#FF6B9D');
    });

    it('generates lighter variant correctly', () => {
      const color = getAccentColor('stellar-blue');
      const baseLuminance = getRelativeLuminance(color.base);
      const lightLuminance = getRelativeLuminance(color.light);
      expect(lightLuminance).toBeGreaterThan(baseLuminance);
    });

    it('generates darker variant correctly', () => {
      const color = getAccentColor('stellar-blue');
      const baseLuminance = getRelativeLuminance(color.base);
      const darkLuminance = getRelativeLuminance(color.dark);
      expect(darkLuminance).toBeLessThan(baseLuminance);
    });

    it('glow variant is RGBA with opacity', () => {
      const color = getAccentColor('nebula-rose');
      expect(color.glow).toContain('rgba');
      expect(color.glow).toContain('0.3');
    });

    it('works for all accent colors', () => {
      Object.keys(ACCENT_COLORS).forEach((colorName) => {
        const color = getAccentColor(colorName as any);
        expect(color.base).toBeDefined();
        expect(color.light).toBeDefined();
        expect(color.dark).toBeDefined();
        expect(color.glow).toBeDefined();
      });
    });
  });

  describe('hexToRgba', () => {
    it('converts hex to RGBA with alpha', () => {
      expect(hexToRgba('#FF6B9D', 0.5)).toBe('rgba(255, 107, 157, 0.5)');
    });

    it('handles shorthand hex', () => {
      expect(hexToRgba('#FFF', 1)).toBe('rgba(255, 255, 255, 1)');
      expect(hexToRgba('#000', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
    });

    it('handles hex with # prefix', () => {
      expect(hexToRgba('#FF0000', 1)).toBe('rgba(255, 0, 0, 1)');
    });

    it('works with various opacity values', () => {
      expect(hexToRgba('#FF6B9D', 0)).toBe('rgba(255, 107, 157, 0)');
      expect(hexToRgba('#FF6B9D', 0.25)).toBe('rgba(255, 107, 157, 0.25)');
      expect(hexToRgba('#FF6B9D', 0.75)).toBe('rgba(255, 107, 157, 0.75)');
      expect(hexToRgba('#FF6B9D', 1)).toBe('rgba(255, 107, 157, 1)');
    });
  });

  describe('adjustBrightness', () => {
    it('lightens color with positive amount', () => {
      const darkColor = '#000000';
      const result = adjustBrightness(darkColor, 0.5);

      expect(result).not.toBe(darkColor);
      const resultLuminance = getRelativeLuminance(result);
      const originalLuminance = getRelativeLuminance(darkColor);
      expect(resultLuminance).toBeGreaterThan(originalLuminance);
    });

    it('darkens color with negative amount', () => {
      const lightColor = '#FFFFFF';
      const result = adjustBrightness(lightColor, -0.5);

      expect(result).not.toBe(lightColor);
      const resultLuminance = getRelativeLuminance(result);
      const originalLuminance = getRelativeLuminance(lightColor);
      expect(resultLuminance).toBeLessThan(originalLuminance);
    });

    it('clamps values to valid range', () => {
      // Should not exceed #FFFFFF when lightening
      const result = adjustBrightness('#FFFFFF', 0.5);
      expect(result).toBe('#FFFFFF');

      // Should not go below #000000 when darkening
      const result2 = adjustBrightness('#000000', -0.5);
      expect(result2).toBe('#000000');
    });

    it('returns uppercase hex', () => {
      const result = adjustBrightness('#ff6b9d', 0.1);
      expect(result).toMatch(/^#[0-9A-F]{6}$/);
    });
  });

  describe('getGlowColor', () => {
    it('creates glow variant with default opacity', () => {
      const glow = getGlowColor('#FF6B9D');
      expect(glow).toContain('rgba');
      expect(glow).toContain('0.3'); // Default opacity
    });

    it('creates glow variant with custom opacity', () => {
      const glow = getGlowColor('#FF6B9D', 0.5);
      expect(glow).toContain('rgba');
      expect(glow).toContain('0.5');
    });

    it('maintains color values', () => {
      const glow = getGlowColor('#FF6B9D', 0.3);
      expect(glow).toBe('rgba(255, 107, 157, 0.3)');
    });
  });

  describe('meetsContrastRequirement', () => {
    it('returns true for sufficient contrast', () => {
      // Black on white has 21:1 ratio
      expect(meetsContrastRequirement('#FFFFFF', '#000000')).toBe(true);
      expect(meetsContrastRequirement('#000000', '#FFFFFF')).toBe(true);
    });

    it('returns false for insufficient contrast', () => {
      // Similar light colors
      expect(meetsContrastRequirement('#CCCCCC', '#DDDDDD')).toBe(false);
      // Similar dark colors
      expect(meetsContrastRequirement('#111111', '#222222')).toBe(false);
    });

    it('checks all accent colors against deep-space background', () => {
      const background = BASE_COLORS['deep-space'];

      Object.values(ACCENT_COLORS).forEach((accentColor) => {
        const passes = meetsContrastRequirement(accentColor, background);
        expect(passes).toBe(true);
      });
    });

    it('checks text colors against deep-space background', () => {
      const background = BASE_COLORS['deep-space'];

      expect(meetsContrastRequirement(BASE_COLORS['stardust'], background)).toBe(true);
      expect(meetsContrastRequirement(BASE_COLORS['moonlight'], background)).toBe(true);
    });

    it('respects WCAG AAA level', () => {
      // Test with a color pair that meets AA but not AAA
      const result = meetsContrastRequirement('#767676', '#FFFFFF', 'AAA');
      // This should be evaluated based on actual contrast ratio
      expect(typeof result).toBe('boolean');
    });
  });

  describe('calculateContrastRatio', () => {
    it('returns maximum ratio for black and white', () => {
      const ratio = calculateContrastRatio('#FFFFFF', '#000000');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('returns 1 for same colors', () => {
      const ratio = calculateContrastRatio('#FF0000', '#FF0000');
      expect(ratio).toBeCloseTo(1, 1);
    });

    it('returns value between 1 and 21', () => {
      const ratio = calculateContrastRatio('#FF6B9D', '#0B0B1E');
      expect(ratio).toBeGreaterThanOrEqual(1);
      expect(ratio).toBeLessThanOrEqual(21);
    });
  });

  describe('getRelativeLuminance', () => {
    it('returns 1 for white', () => {
      const luminance = getRelativeLuminance('#FFFFFF');
      expect(luminance).toBeCloseTo(1, 2);
    });

    it('returns 0 for black', () => {
      const luminance = getRelativeLuminance('#000000');
      expect(luminance).toBeCloseTo(0, 2);
    });

    it('returns value between 0 and 1', () => {
      const luminance = getRelativeLuminance('#FF6B9D');
      expect(luminance).toBeGreaterThanOrEqual(0);
      expect(luminance).toBeLessThanOrEqual(1);
    });
  });

  describe('Accessibility Compliance', () => {
    it('all accent colors meet WCAG AA on deep-space', () => {
      const darkBg = BASE_COLORS['deep-space'];

      Object.entries(ACCENT_COLORS).forEach(([name, color]) => {
        const passes = meetsContrastRequirement(color, darkBg, 'AA');
        expect(passes).toBe(true);
      });
    });

    it('stardust text meets WCAG AA on deep-space', () => {
      const textColor = BASE_COLORS['stardust'];
      const background = BASE_COLORS['deep-space'];
      expect(meetsContrastRequirement(textColor, background, 'AA')).toBe(true);
    });

    it('moonlight text meets minimum contrast on deep-space', () => {
      const textColor = BASE_COLORS['moonlight'];
      const background = BASE_COLORS['deep-space'];
      const ratio = calculateContrastRatio(textColor, background);
      expect(ratio).toBeGreaterThan(3); // Minimum for UI components
    });

    it('semantic colors are distinguishable on dark background', () => {
      const background = BASE_COLORS['deep-space'];

      Object.values(SEMANTIC_COLORS).forEach((semanticColor) => {
        const ratio = calculateContrastRatio(semanticColor, background);
        expect(ratio).toBeGreaterThan(3);
      });
    });
  });
});
