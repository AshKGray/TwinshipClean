/**
 * Font Optimization for Startup Performance
 * Async font loading to prevent blocking UI render
 */

import * as React from 'react';
import * as Font from 'expo-font';
import { performanceTracker } from './performanceTracker';

interface FontLoadingConfig {
  fonts: { [fontFamily: string]: any };
  preloadCritical: string[];
  deferNonCritical: string[];
}

export class FontOptimizer {
  private static instance: FontOptimizer;
  private fontsLoaded = new Set<string>();
  private fontLoadingPromises = new Map<string, Promise<void>>();

  static getInstance(): FontOptimizer {
    if (!FontOptimizer.instance) {
      FontOptimizer.instance = new FontOptimizer();
    }
    return FontOptimizer.instance;
  }

  /**
   * Load critical fonts immediately (blocking)
   * These are essential fonts needed for first render
   */
  async loadCriticalFonts(fontConfig: FontLoadingConfig): Promise<void> {
    const startTime = Date.now();
    performanceTracker.mark('fontLoadingStart');

    try {
      // Load only critical fonts first
      const criticalFonts: { [key: string]: any } = {};
      fontConfig.preloadCritical.forEach(fontName => {
        if (fontConfig.fonts[fontName]) {
          criticalFonts[fontName] = fontConfig.fonts[fontName];
        }
      });

      if (Object.keys(criticalFonts).length > 0) {
        await Font.loadAsync(criticalFonts);

        // Mark critical fonts as loaded
        fontConfig.preloadCritical.forEach(fontName => {
          this.fontsLoaded.add(fontName);
        });

        console.log(`[FontOptimizer] Critical fonts loaded in ${Date.now() - startTime}ms:`, fontConfig.preloadCritical);
      }

      performanceTracker.mark('criticalFontsLoaded');

    } catch (error) {
      console.error('[FontOptimizer] Failed to load critical fonts:', error);
      // Don't throw - app should still work with system fonts
    }
  }

  /**
   * Load non-critical fonts in background (non-blocking)
   * These fonts can be loaded after initial render
   */
  loadNonCriticalFonts(fontConfig: FontLoadingConfig): void {
    const startTime = Date.now();

    // Use requestIdleCallback or setTimeout to defer loading
    const scheduleNonCriticalLoading = () => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => this.performNonCriticalLoading(fontConfig, startTime));
      } else {
        setTimeout(() => this.performNonCriticalLoading(fontConfig, startTime), 100);
      }
    };

    scheduleNonCriticalLoading();
  }

  private async performNonCriticalLoading(fontConfig: FontLoadingConfig, startTime: number): Promise<void> {
    try {
      // Load non-critical fonts in chunks to avoid blocking
      const nonCriticalFonts: { [key: string]: any } = {};

      fontConfig.deferNonCritical.forEach(fontName => {
        if (fontConfig.fonts[fontName] && !this.fontsLoaded.has(fontName)) {
          nonCriticalFonts[fontName] = fontConfig.fonts[fontName];
        }
      });

      if (Object.keys(nonCriticalFonts).length > 0) {
        await Font.loadAsync(nonCriticalFonts);

        // Mark non-critical fonts as loaded
        fontConfig.deferNonCritical.forEach(fontName => {
          this.fontsLoaded.add(fontName);
        });

        console.log(`[FontOptimizer] Non-critical fonts loaded in ${Date.now() - startTime}ms:`, fontConfig.deferNonCritical);
      }

      performanceTracker.mark('allFontsLoaded');

    } catch (error) {
      console.error('[FontOptimizer] Failed to load non-critical fonts:', error);
      // Non-critical failure - continue without these fonts
    }
  }

  /**
   * Load a specific font on-demand
   */
  async loadFontOnDemand(fontName: string, fontSource: any): Promise<void> {
    if (this.fontsLoaded.has(fontName)) {
      return; // Already loaded
    }

    // Check if already loading
    if (this.fontLoadingPromises.has(fontName)) {
      return this.fontLoadingPromises.get(fontName);
    }

    // Create loading promise
    const loadingPromise = this.performOnDemandLoading(fontName, fontSource);
    this.fontLoadingPromises.set(fontName, loadingPromise);

    return loadingPromise;
  }

  private async performOnDemandLoading(fontName: string, fontSource: any): Promise<void> {
    try {
      await Font.loadAsync({ [fontName]: fontSource });
      this.fontsLoaded.add(fontName);
      console.log(`[FontOptimizer] On-demand font loaded: ${fontName}`);
    } catch (error) {
      console.error(`[FontOptimizer] Failed to load font on-demand: ${fontName}`, error);
    } finally {
      this.fontLoadingPromises.delete(fontName);
    }
  }

  /**
   * Check if a font is loaded
   */
  isFontLoaded(fontName: string): boolean {
    return this.fontsLoaded.has(fontName);
  }

  /**
   * Get font loading status
   */
  getLoadingStatus(): {
    loaded: string[];
    loading: string[];
    totalLoaded: number;
  } {
    return {
      loaded: Array.from(this.fontsLoaded),
      loading: Array.from(this.fontLoadingPromises.keys()),
      totalLoaded: this.fontsLoaded.size,
    };
  }

  /**
   * Preload fonts with performance optimization
   */
  static async optimizedFontPreload(): Promise<void> {
    const optimizer = FontOptimizer.getInstance();

    // Define your app's font configuration
    const fontConfig: FontLoadingConfig = {
      fonts: {
        // Add your app's fonts here
        // Example:
        // 'Inter-Regular': require('../../assets/fonts/Inter-Regular.ttf'),
        // 'Inter-Bold': require('../../assets/fonts/Inter-Bold.ttf'),
        // 'SpaceMono-Regular': require('../../assets/fonts/SpaceMono-Regular.ttf'),
      },
      preloadCritical: [
        // Fonts needed immediately for first render
        // 'Inter-Regular',
      ],
      deferNonCritical: [
        // Fonts that can be loaded later
        // 'Inter-Bold',
        // 'SpaceMono-Regular',
      ],
    };

    // Load critical fonts first (blocking)
    await optimizer.loadCriticalFonts(fontConfig);

    // Schedule non-critical fonts for background loading
    optimizer.loadNonCriticalFonts(fontConfig);
  }
}

// Export the singleton instance
export const fontOptimizer = FontOptimizer.getInstance();

// React hook for font loading with fallback
export function useFontWithFallback(fontName: string, fallback: string = 'System'): string {
  const [currentFont, setCurrentFont] = React.useState(fallback);

  React.useEffect(() => {
    if (fontOptimizer.isFontLoaded(fontName)) {
      setCurrentFont(fontName);
    } else {
      // Font not loaded, stick with fallback
      console.log(`[FontOptimizer] Font ${fontName} not loaded, using fallback: ${fallback}`);
    }
  }, [fontName, fallback]);

  return currentFont;
}

// Utility to create font-aware styles
export function createFontAwareStyle(baseStyle: any, fontName: string, fallback: string = 'System') {
  return {
    ...baseStyle,
    fontFamily: fontOptimizer.isFontLoaded(fontName) ? fontName : fallback,
  };
}