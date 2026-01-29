/**
 * Gradient System Unit Tests
 *
 * Tests for the Galaxy Theme gradient system.
 */

import {
  GALAXY_GRADIENTS,
  createGradient,
  getGradient,
} from '../gradients';

describe('Gradient System', () => {
  describe('GALAXY_GRADIENTS', () => {
    it('exports all predefined gradients', () => {
      expect(GALAXY_GRADIENTS).toHaveProperty('cosmic');
      expect(GALAXY_GRADIENTS).toHaveProperty('nebula');
      expect(GALAXY_GRADIENTS).toHaveProperty('aurora');
      expect(GALAXY_GRADIENTS).toHaveProperty('stellar');
      expect(GALAXY_GRADIENTS).toHaveProperty('sunset');
    });

    it('each gradient has required properties', () => {
      Object.values(GALAXY_GRADIENTS).forEach((gradient) => {
        expect(gradient).toHaveProperty('colors');
        expect(gradient).toHaveProperty('start');
        expect(gradient).toHaveProperty('end');
        expect(Array.isArray(gradient.colors)).toBe(true);
        expect(gradient.colors.length).toBeGreaterThan(0);
      });
    });

    it('cosmic gradient has correct structure', () => {
      const { cosmic } = GALAXY_GRADIENTS;
      expect(cosmic.colors).toEqual(['#6366F1', '#8B5CF6', '#EC4899']);
      expect(cosmic.start).toEqual({ x: 0, y: 0 });
      expect(cosmic.end).toEqual({ x: 1, y: 1 });
    });

    it('nebula gradient has correct structure', () => {
      const { nebula } = GALAXY_GRADIENTS;
      expect(nebula.colors).toEqual(['#FF6B9D', '#FF7F50', '#FFB347']);
      expect(nebula.start).toEqual({ x: 0, y: 0 });
      expect(nebula.end).toEqual({ x: 0, y: 1 });
    });

    it('aurora gradient has correct structure', () => {
      const { aurora } = GALAXY_GRADIENTS;
      expect(aurora.colors).toEqual(['#00D4FF', '#00CED1', '#8FD14F']);
      expect(aurora.start).toEqual({ x: 0, y: 0 });
      expect(aurora.end).toEqual({ x: 1, y: 0 });
    });
  });

  describe('createGradient', () => {
    it('creates gradient with correct structure', () => {
      const gradient = createGradient(['#FF0000', '#00FF00'], 'vertical');

      expect(gradient.colors).toEqual(['#FF0000', '#00FF00']);
      expect(gradient.start).toBeDefined();
      expect(gradient.end).toBeDefined();
    });

    it('creates vertical gradient correctly', () => {
      const gradient = createGradient(['#FF0000', '#00FF00'], 'vertical');

      expect(gradient.start).toEqual({ x: 0, y: 0 });
      expect(gradient.end).toEqual({ x: 0, y: 1 });
    });

    it('creates horizontal gradient correctly', () => {
      const gradient = createGradient(['#FF0000', '#00FF00'], 'horizontal');

      expect(gradient.start).toEqual({ x: 0, y: 0 });
      expect(gradient.end).toEqual({ x: 1, y: 0 });
    });

    it('creates diagonal-down gradient correctly', () => {
      const gradient = createGradient(['#FF0000', '#00FF00'], 'diagonal-down');

      expect(gradient.start).toEqual({ x: 0, y: 0 });
      expect(gradient.end).toEqual({ x: 1, y: 1 });
    });

    it('creates diagonal-up gradient correctly', () => {
      const gradient = createGradient(['#FF0000', '#00FF00'], 'diagonal-up');

      expect(gradient.start).toEqual({ x: 0, y: 1 });
      expect(gradient.end).toEqual({ x: 1, y: 0 });
    });

    it('defaults to vertical gradient', () => {
      const gradient = createGradient(['#FF0000', '#00FF00']);

      expect(gradient.start).toEqual({ x: 0, y: 0 });
      expect(gradient.end).toEqual({ x: 0, y: 1 });
    });

    it('supports multiple colors', () => {
      const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'];
      const gradient = createGradient(colors, 'vertical');

      expect(gradient.colors).toEqual(colors);
      expect(gradient.colors).toHaveLength(4);
    });

    it('preserves color order', () => {
      const colors = ['#FF0000', '#00FF00', '#0000FF'];
      const gradient = createGradient(colors, 'horizontal');

      expect(gradient.colors[0]).toBe('#FF0000');
      expect(gradient.colors[1]).toBe('#00FF00');
      expect(gradient.colors[2]).toBe('#0000FF');
    });
  });

  describe('getGradient', () => {
    it('returns gradient by name', () => {
      const cosmic = getGradient('cosmic');

      expect(cosmic).toBeDefined();
      expect(cosmic?.colors).toEqual(GALAXY_GRADIENTS.cosmic.colors);
    });

    it('returns undefined for unknown gradient', () => {
      const unknown = getGradient('unknown-gradient');

      expect(unknown).toBeUndefined();
    });

    it('works for all predefined gradients', () => {
      const gradientNames = ['cosmic', 'nebula', 'aurora', 'stellar', 'sunset'];

      gradientNames.forEach((name) => {
        const gradient = getGradient(name);
        expect(gradient).toBeDefined();
        expect(gradient).toEqual(GALAXY_GRADIENTS[name]);
      });
    });
  });

  describe('Gradient Coordinates', () => {
    it('all coordinates are in 0-1 range', () => {
      Object.values(GALAXY_GRADIENTS).forEach((gradient) => {
        expect(gradient.start.x).toBeGreaterThanOrEqual(0);
        expect(gradient.start.x).toBeLessThanOrEqual(1);
        expect(gradient.start.y).toBeGreaterThanOrEqual(0);
        expect(gradient.start.y).toBeLessThanOrEqual(1);
        expect(gradient.end.x).toBeGreaterThanOrEqual(0);
        expect(gradient.end.x).toBeLessThanOrEqual(1);
        expect(gradient.end.y).toBeGreaterThanOrEqual(0);
        expect(gradient.end.y).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Gradient Colors', () => {
    it('all gradient colors are valid hex', () => {
      const hexPattern = /^#[0-9A-F]{6}$/i;

      Object.values(GALAXY_GRADIENTS).forEach((gradient) => {
        gradient.colors.forEach((color) => {
          expect(color).toMatch(hexPattern);
        });
      });
    });

    it('gradients have at least 2 colors', () => {
      Object.values(GALAXY_GRADIENTS).forEach((gradient) => {
        expect(gradient.colors.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
