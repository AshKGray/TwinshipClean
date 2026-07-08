# Story 6.1: Galaxy Theme Color System and Variables

**Epic**: Epic 6 - Galaxy Visual Design System
**Story ID**: 6.1
**Status**: Drafted
**Effort**: Small (2-3 hours)
**Dependencies**: None (foundational story)

---

## User Story

**As a** developer
**I want** a centralized color system with galaxy-themed colors
**So that** the app has consistent theming across all screens and components

---

## Acceptance Criteria

1. **Color Palette Definition**
   - Define 8 galaxy-themed accent colors with hex values
   - Define 5 base UI colors (backgrounds, text, borders)
   - Each accent color includes light, base, dark, and glow variants
   - All colors exported from `src/theme/colors.ts`

2. **Color Utilities**
   - `getAccentColor(name)` returns ColorWithVariants object
   - `hexToRgba(hex, alpha)` converts hex to RGBA
   - `adjustBrightness(hex, amount)` lightens/darkens color
   - `getGlowColor(baseColor, opacity)` creates glow variant
   - `meetsContrastRequirement(fg, bg)` checks WCAG AA compliance

3. **Gradient System**
   - Define 3+ cosmic gradient combinations in `src/theme/gradients.ts`
   - `createGradient(colors, direction)` utility function
   - Gradients exported as `GALAXY_GRADIENTS` object
   - Integration with expo-linear-gradient

4. **NativeWind Integration**
   - Colors added to `tailwind.config.js` theme
   - Accent colors accessible via Tailwind classes (e.g., `text-stellar-blue`)
   - Base colors available (e.g., `bg-deep-space`)

5. **Accessibility Compliance**
   - All text color + background combinations meet WCAG AA (4.5:1)
   - Large text combinations meet 3:1 ratio
   - Automated contrast checking in utility

6. **TypeScript Types**
   - `GalaxyColor` type for all colors
   - `GalaxyAccentColor` type for user-selectable colors
   - `ColorWithVariants` interface
   - `GalaxyGradient` interface
   - Full type safety with no TypeScript errors

7. **Documentation**
   - Color swatch documentation in comments
   - Usage examples for each utility function
   - Gradient visual reference

---

## Implementation Details

### Files to Create/Modify

**New Files:**
- `src/theme/colors.ts` - Color palette and utilities
- `src/theme/gradients.ts` - Gradient definitions
- `src/theme/types.ts` - Shared TypeScript types
- `src/theme/index.ts` - Barrel export

**Modified Files:**
- `tailwind.config.js` - Add custom colors to theme
- `src/theme/README.md` - Theme system documentation (new)

### Color Palette Specification

```typescript
// Accent Colors (user-selectable)
const ACCENT_COLORS = {
  'nebula-rose': '#FF6B9D',
  'stellar-blue': '#00D4FF',
  'orbit-sage': '#8FD14F',
  'solar-amber': '#FFB347',
  'celestial-indigo': '#6366F1',
  'comet-coral': '#FF7F50',
  'aurora-teal': '#00CED1',
  'meteor-copper': '#D4AF37',
};

// Base UI Colors
const BASE_COLORS = {
  'deep-space': '#0B0B1E',      // Background dark
  'cosmic-void': '#060612',      // Background darker
  'stardust': '#E5E7EB',         // Text primary
  'moonlight': '#9CA3AF',        // Text secondary
  'nebula-mist': '#374151',      // Border/divider
};

// Semantic Colors
const SEMANTIC_COLORS = {
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};
```

### Gradient Definitions

```typescript
const GALAXY_GRADIENTS = {
  cosmic: {
    colors: ['#6366F1', '#8B5CF6', '#EC4899'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  nebula: {
    colors: ['#FF6B9D', '#FF7F50', '#FFB347'],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  aurora: {
    colors: ['#00D4FF', '#00CED1', '#8FD14F'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
};
```

### Utility Function Signatures

```typescript
export function getAccentColor(name: GalaxyAccentColor): ColorWithVariants;
export function hexToRgba(hex: string, alpha: number): string;
export function adjustBrightness(hex: string, amount: number): string;
export function getGlowColor(baseColor: string, opacity?: number): string;
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level?: 'AA' | 'AAA'
): boolean;
```

### NativeWind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Accent colors
        'nebula-rose': '#FF6B9D',
        'stellar-blue': '#00D4FF',
        // ... rest of accent colors

        // Base colors
        'deep-space': '#0B0B1E',
        'cosmic-void': '#060612',
        'stardust': '#E5E7EB',
        'moonlight': '#9CA3AF',
        'nebula-mist': '#374151',

        // Semantic
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
      },
    },
  },
};
```

---

## Technical Approach

### 1. Color Variant Generation

```typescript
function getAccentColor(name: GalaxyAccentColor): ColorWithVariants {
  const base = ACCENT_COLORS[name];

  return {
    base,
    light: adjustBrightness(base, 0.2),    // 20% lighter
    dark: adjustBrightness(base, -0.2),    // 20% darker
    glow: hexToRgba(base, 0.3),            // 30% opacity for glow
  };
}
```

### 2. Contrast Checking Algorithm

```typescript
function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  const threshold = level === 'AAA' ? 7 : 4.5;

  return ratio >= threshold;
}

// Using relative luminance formula from WCAG
function calculateContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}
```

### 3. Brightness Adjustment

```typescript
function adjustBrightness(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);

  const adjust = (value: number) => {
    const adjusted = value + (amount * 255);
    return Math.max(0, Math.min(255, Math.round(adjusted)));
  };

  return rgbToHex(adjust(r), adjust(g), adjust(b));
}
```

---

## Testing Requirements

### Unit Tests

**File**: `src/theme/__tests__/colors.test.ts`

```typescript
describe('Color System', () => {
  describe('getAccentColor', () => {
    it('returns all color variants', () => {
      const color = getAccentColor('stellar-blue');
      expect(color).toHaveProperty('base');
      expect(color).toHaveProperty('light');
      expect(color).toHaveProperty('dark');
      expect(color).toHaveProperty('glow');
    });

    it('generates lighter variant correctly', () => {
      const color = getAccentColor('stellar-blue');
      const baseLuminance = getRelativeLuminance(color.base);
      const lightLuminance = getRelativeLuminance(color.light);
      expect(lightLuminance).toBeGreaterThan(baseLuminance);
    });
  });

  describe('hexToRgba', () => {
    it('converts hex to RGBA with alpha', () => {
      expect(hexToRgba('#FF6B9D', 0.5)).toBe('rgba(255, 107, 157, 0.5)');
    });

    it('handles shorthand hex', () => {
      expect(hexToRgba('#FFF', 1)).toBe('rgba(255, 255, 255, 1)');
    });
  });

  describe('adjustBrightness', () => {
    it('lightens color with positive amount', () => {
      const result = adjustBrightness('#000000', 0.5);
      expect(result).not.toBe('#000000');
      // Should be lighter (higher luminance)
    });

    it('darkens color with negative amount', () => {
      const result = adjustBrightness('#FFFFFF', -0.5);
      expect(result).not.toBe('#FFFFFF');
      // Should be darker (lower luminance)
    });
  });

  describe('meetsContrastRequirement', () => {
    it('returns true for sufficient contrast', () => {
      expect(meetsContrastRequirement('#FFFFFF', '#000000')).toBe(true);
    });

    it('returns false for insufficient contrast', () => {
      expect(meetsContrastRequirement('#CCCCCC', '#DDDDDD')).toBe(false);
    });

    it('checks all accent colors against deep-space background', () => {
      Object.keys(ACCENT_COLORS).forEach(colorName => {
        const accentColor = ACCENT_COLORS[colorName];
        const passes = meetsContrastRequirement(accentColor, '#0B0B1E');
        expect(passes).toBe(true);
      });
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
      expect(glow).toContain('0.5');
    });
  });
});

describe('Gradients', () => {
  it('exports all gradient definitions', () => {
    expect(GALAXY_GRADIENTS).toHaveProperty('cosmic');
    expect(GALAXY_GRADIENTS).toHaveProperty('nebula');
    expect(GALAXY_GRADIENTS).toHaveProperty('aurora');
  });

  it('creates gradient with correct structure', () => {
    const gradient = createGradient(['#FF0000', '#00FF00'], 'vertical');
    expect(gradient.colors).toHaveLength(2);
    expect(gradient.start).toBeDefined();
    expect(gradient.end).toBeDefined();
  });
});
```

### Visual Tests

**File**: `src/theme/__tests__/colors.visual.test.tsx`

```typescript
describe('Color Visual Tests', () => {
  it('renders color swatches correctly', () => {
    const { getByTestId } = render(<ColorSwatchGrid />);

    Object.keys(ACCENT_COLORS).forEach(colorName => {
      const swatch = getByTestId(`swatch-${colorName}`);
      expect(swatch).toBeTruthy();
    });
  });

  it('displays gradients correctly', () => {
    const { getByTestId } = render(<GradientPreview />);

    Object.keys(GALAXY_GRADIENTS).forEach(gradientName => {
      const gradient = getByTestId(`gradient-${gradientName}`);
      expect(gradient).toBeTruthy();
    });
  });
});
```

### Accessibility Tests

```typescript
describe('Accessibility', () => {
  it('all text colors meet WCAG AA on dark background', () => {
    const darkBg = '#0B0B1E';
    const textColors = ['#E5E7EB', '#9CA3AF'];

    textColors.forEach(color => {
      expect(meetsContrastRequirement(color, darkBg, 'AA')).toBe(true);
    });
  });

  it('all accent colors are distinguishable from background', () => {
    const background = '#0B0B1E';

    Object.values(ACCENT_COLORS).forEach(accentColor => {
      const ratio = calculateContrastRatio(accentColor, background);
      expect(ratio).toBeGreaterThan(3); // Minimum for UI components
    });
  });
});
```

---

## Definition of Done

- [ ] `colors.ts` file created with all color definitions
- [ ] `gradients.ts` file created with gradient system
- [ ] All utility functions implemented and typed
- [ ] NativeWind configuration updated with custom colors
- [ ] Unit tests written and passing (80%+ coverage)
- [ ] Visual tests for color swatches passing
- [ ] Accessibility tests confirm WCAG AA compliance
- [ ] TypeScript compiles with no errors
- [ ] Documentation added to README
- [ ] Code reviewed and approved
- [ ] Colors successfully used in example component

---

## Related Stories

- **Blocks**: 6.2 (Galaxy Background), 6.3 (Neon Button), 6.4 (Cosmic Card)
- **Related**: 1.2 (Color Selection in Onboarding uses this palette)

---

## Notes

- This is the foundational story for Epic 6 - all other design system stories depend on it
- Color contrast checking is critical for accessibility compliance
- Variants should be generated programmatically to ensure consistency
- Consider adding a Storybook page to visualize all colors and gradients (Phase 2)
- All colors should work well on dark theme background (`deep-space`)

---

**Created**: 2025-11-18
**Author**: Claude (BMAD Method)
**Status**: Drafted
