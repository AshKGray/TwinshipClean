/**
 * Enhanced Performance Tracker for Startup Monitoring
 * Tracks key startup milestones and cold start metrics
 */
import * as SplashScreen from 'expo-splash-screen';

interface PerformanceMark {
  name: string;
  timestamp: number;
  details?: any;
}

interface StartupMetrics {
  appStart: number;
  firstRender: number;
  navigationReady: number;
  criticalResourcesLoaded: number;
  appReady: number;
  totalStartupTime: number;
}

export class PerformanceTracker {
  private marks: Map<string, PerformanceMark> = new Map();
  private startupMetrics: Partial<StartupMetrics> = {};
  private isStartupComplete = false;

  constructor() {
    // Mark app start immediately
    this.mark('appStart');

    // Keep splash screen visible until we're ready
    this.preventAutoHide();
  }

  private async preventAutoHide() {
    try {
      await SplashScreen.preventAutoHideAsync();
      console.log('[PerformanceTracker] Splash screen will be controlled manually');
    } catch (error) {
      console.warn('[PerformanceTracker] Failed to control splash screen:', error);
    }
  }

  /**
   * Mark a performance milestone
   */
  mark(name: string, details?: any): void {
    const timestamp = Date.now();
    this.marks.set(name, { name, timestamp, details });

    // Track startup-specific metrics
    if (name === 'appStart') {
      this.startupMetrics.appStart = timestamp;
    } else if (name === 'firstRender') {
      this.startupMetrics.firstRender = timestamp;
    } else if (name === 'navigationReady') {
      this.startupMetrics.navigationReady = timestamp;
    } else if (name === 'criticalResourcesLoaded') {
      this.startupMetrics.criticalResourcesLoaded = timestamp;
    } else if (name === 'appReady') {
      this.startupMetrics.appReady = timestamp;
      this.calculateTotalStartupTime();
      this.completeStartup();
    }

    console.log(`[PerformanceTracker] ${name}:`, timestamp, details || '');
  }

  /**
   * Measure time between two marks
   */
  measure(startMark: string, endMark: string): number {
    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);

    if (!start || !end) {
      console.warn(`[PerformanceTracker] Missing marks for measurement: ${startMark} -> ${endMark}`);
      return 0;
    }

    const duration = end.timestamp - start.timestamp;
    console.log(`[PerformanceTracker] ${startMark} -> ${endMark}: ${duration}ms`);
    return duration;
  }

  /**
   * Get current performance budget status
   */
  getPerformanceBudgetStatus(): {
    withinBudget: boolean;
    violations: string[];
    metrics: Partial<StartupMetrics>;
  } {
    const violations: string[] = [];
    const { appStart, firstRender, navigationReady, criticalResourcesLoaded, appReady } = this.startupMetrics;

    // Performance budgets (milliseconds)
    const budgets = {
      firstRender: 1000,    // First render should happen within 1s
      navigationReady: 1500, // Navigation should be ready within 1.5s
      criticalResources: 2000, // Critical resources within 2s
      totalStartup: 3000     // Total startup within 3s
    };

    if (appStart && firstRender && (firstRender - appStart) > budgets.firstRender) {
      violations.push(`First render exceeded budget: ${firstRender - appStart}ms > ${budgets.firstRender}ms`);
    }

    if (appStart && navigationReady && (navigationReady - appStart) > budgets.navigationReady) {
      violations.push(`Navigation ready exceeded budget: ${navigationReady - appStart}ms > ${budgets.navigationReady}ms`);
    }

    if (appStart && criticalResourcesLoaded && (criticalResourcesLoaded - appStart) > budgets.criticalResources) {
      violations.push(`Critical resources exceeded budget: ${criticalResourcesLoaded - appStart}ms > ${budgets.criticalResources}ms`);
    }

    if (this.startupMetrics.totalStartupTime && this.startupMetrics.totalStartupTime > budgets.totalStartup) {
      violations.push(`Total startup exceeded budget: ${this.startupMetrics.totalStartupTime}ms > ${budgets.totalStartup}ms`);
    }

    return {
      withinBudget: violations.length === 0,
      violations,
      metrics: this.startupMetrics
    };
  }

  /**
   * Generate comprehensive startup report
   */
  generateStartupReport(): {
    metrics: Partial<StartupMetrics>;
    timings: { [key: string]: number };
    budget: any;
    recommendations: string[];
  } {
    const timings: { [key: string]: number } = {};
    const { appStart } = this.startupMetrics;

    if (appStart) {
      Object.entries(this.startupMetrics).forEach(([key, timestamp]) => {
        if (key !== 'appStart' && key !== 'totalStartupTime' && timestamp) {
          timings[key] = timestamp - appStart;
        }
      });
    }

    const budget = this.getPerformanceBudgetStatus();
    const recommendations = this.generateRecommendations(budget);

    return {
      metrics: this.startupMetrics,
      timings,
      budget,
      recommendations
    };
  }

  private calculateTotalStartupTime(): void {
    const { appStart, appReady } = this.startupMetrics;
    if (appStart && appReady) {
      this.startupMetrics.totalStartupTime = appReady - appStart;
    }
  }

  private async completeStartup(): Promise<void> {
    if (this.isStartupComplete) return;

    this.isStartupComplete = true;

    // Hide splash screen
    try {
      await SplashScreen.hideAsync();
      console.log('[PerformanceTracker] Splash screen hidden - app ready');
    } catch (error) {
      console.warn('[PerformanceTracker] Failed to hide splash screen:', error);
    }

    // Generate and log startup report
    const report = this.generateStartupReport();
    console.log('[PerformanceTracker] Startup Complete Report:', JSON.stringify(report, null, 2));

    // Alert if performance budget violations exist
    if (!report.budget.withinBudget) {
      console.warn('[PerformanceTracker] Performance budget violations detected:', report.budget.violations);
    }
  }

  private generateRecommendations(budget: ReturnType<typeof this.getPerformanceBudgetStatus>): string[] {
    const recommendations: string[] = [];

    if (!budget.withinBudget) {
      recommendations.push('Consider lazy loading non-critical components');
      recommendations.push('Optimize image loading and use placeholder images');
      recommendations.push('Defer analytics and non-essential service initialization');
      recommendations.push('Use React.memo and useMemo for expensive computations');
      recommendations.push('Implement code splitting for large screens');
    }

    const { totalStartupTime } = budget.metrics;
    if (totalStartupTime && totalStartupTime > 2000) {
      recommendations.push('Startup time is high - consider more aggressive lazy loading');
    }

    return recommendations;
  }

  /**
   * Get all recorded marks
   */
  getAllMarks(): Map<string, PerformanceMark> {
    return new Map(this.marks);
  }

  /**
   * Export metrics for BMAD integration
   */
  exportForBMAD(): {
    startupMetrics: Partial<StartupMetrics>;
    performanceMarks: Array<PerformanceMark>;
    budgetStatus: any;
  } {
    return {
      startupMetrics: this.startupMetrics,
      performanceMarks: Array.from(this.marks.values()),
      budgetStatus: this.getPerformanceBudgetStatus()
    };
  }
}

// Global instance for use throughout the app
export const performanceTracker = new PerformanceTracker();

// React Native Performance API integration
if (typeof performance !== 'undefined' && performance.mark) {
  // Enhance with native performance API if available
  const originalMark = performanceTracker.mark.bind(performanceTracker);
  performanceTracker.mark = (name: string, details?: any) => {
    performance.mark(name);
    originalMark(name, details);
  };
}