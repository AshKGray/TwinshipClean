/**
 * Performance Measurement Utility for Lazy Loading
 * Tracks improvements from code splitting implementation
 */

interface PerformanceMetrics {
  startTime: number;
  componentLoadTime: number;
  renderTime: number;
  memoryUsage: number;
  bundleSize?: number;
}

interface LazyLoadMetrics {
  componentName: string;
  loadStart: number;
  loadEnd: number;
  renderStart: number;
  renderEnd: number;
  cached: boolean;
}

class PerformanceTracker {
  private metrics = new Map<string, PerformanceMetrics>();
  private lazyLoadMetrics = new Map<string, LazyLoadMetrics>();
  private loadStartTimes = new Map<string, number>();

  /**
   * Start tracking performance for a component
   */
  startTracking(componentName: string): void {
    const startTime = performance.now();
    this.loadStartTimes.set(componentName, startTime);
    
    console.log(`[Performance] Started tracking ${componentName} at ${startTime.toFixed(2)}ms`);
  }

  /**
   * Mark when component loading begins
   */
  markLoadStart(componentName: string): void {
    const loadStart = performance.now();
    const existing = this.lazyLoadMetrics.get(componentName) || {} as LazyLoadMetrics;
    
    this.lazyLoadMetrics.set(componentName, {
      ...existing,
      componentName,
      loadStart,
      cached: false
    });
    
    console.log(`[Performance] ${componentName} load started at ${loadStart.toFixed(2)}ms`);
  }

  /**
   * Mark when component loading completes
   */
  markLoadEnd(componentName: string): void {
    const loadEnd = performance.now();
    const existing = this.lazyLoadMetrics.get(componentName);
    
    if (existing) {
      existing.loadEnd = loadEnd;
      const loadTime = loadEnd - existing.loadStart;
      console.log(`[Performance] ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
    }
  }

  /**
   * Mark when component render starts
   */
  markRenderStart(componentName: string): void {
    const renderStart = performance.now();
    const existing = this.lazyLoadMetrics.get(componentName);
    
    if (existing) {
      existing.renderStart = renderStart;
    }
  }

  /**
   * Mark when component render completes
   */
  markRenderEnd(componentName: string): void {
    const renderEnd = performance.now();
    const existing = this.lazyLoadMetrics.get(componentName);
    
    if (existing) {
      existing.renderEnd = renderEnd;
      const renderTime = renderEnd - existing.renderStart;
      console.log(`[Performance] ${componentName} rendered in ${renderTime.toFixed(2)}ms`);
    }
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage(componentName: string): void {
    // Check if performance.memory is available (Chrome/Edge)
    const memoryInfo = (performance as any).memory;
    if (memoryInfo) {
      const memoryUsage = memoryInfo.usedJSHeapSize / 1048576; // MB
      
      const existing = this.metrics.get(componentName) || {} as PerformanceMetrics;
      existing.memoryUsage = memoryUsage;
      this.metrics.set(componentName, existing);
      
      console.log(`[Performance] ${componentName} memory usage: ${memoryUsage.toFixed(2)}MB`);
    }
  }

  /**
   * Get comprehensive metrics for a component
   */
  getMetrics(componentName: string): LazyLoadMetrics | null {
    return this.lazyLoadMetrics.get(componentName) || null;
  }

  /**
   * Get all recorded metrics
   */
  getAllMetrics(): Record<string, LazyLoadMetrics> {
    const result: Record<string, LazyLoadMetrics> = {};
    this.lazyLoadMetrics.forEach((metrics, componentName) => {
      result[componentName] = metrics;
    });
    return result;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalComponents: number;
    averageLoadTime: number;
    averageRenderTime: number;
    fastestLoad: { component: string; time: number } | null;
    slowestLoad: { component: string; time: number } | null;
    totalTime: number;
  } {
    const metrics = Array.from(this.lazyLoadMetrics.values());
    
    if (metrics.length === 0) {
      return {
        totalComponents: 0,
        averageLoadTime: 0,
        averageRenderTime: 0,
        fastestLoad: null,
        slowestLoad: null,
        totalTime: 0
      };
    }

    const loadTimes = metrics
      .filter(m => m.loadStart && m.loadEnd)
      .map(m => ({ component: m.componentName, time: m.loadEnd - m.loadStart }));
    
    const renderTimes = metrics
      .filter(m => m.renderStart && m.renderEnd)
      .map(m => m.renderEnd - m.renderStart);

    const averageLoadTime = loadTimes.reduce((sum, m) => sum + m.time, 0) / loadTimes.length;
    const averageRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
    
    const sortedLoadTimes = loadTimes.sort((a, b) => a.time - b.time);
    const fastestLoad = sortedLoadTimes[0] || null;
    const slowestLoad = sortedLoadTimes[sortedLoadTimes.length - 1] || null;
    
    const totalTime = metrics.reduce((sum, m) => {
      if (m.loadStart && m.renderEnd) {
        return sum + (m.renderEnd - m.loadStart);
      }
      return sum;
    }, 0);

    return {
      totalComponents: metrics.length,
      averageLoadTime: Number(averageLoadTime.toFixed(2)),
      averageRenderTime: Number(averageRenderTime.toFixed(2)),
      fastestLoad,
      slowestLoad,
      totalTime: Number(totalTime.toFixed(2))
    };
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const summary = this.getPerformanceSummary();
    const allMetrics = this.getAllMetrics();
    
    let report = '\n========== LAZY LOADING PERFORMANCE REPORT ==========\n';
    report += `Total Components Tracked: ${summary.totalComponents}\n`;
    report += `Average Load Time: ${summary.averageLoadTime}ms\n`;
    report += `Average Render Time: ${summary.averageRenderTime}ms\n`;
    report += `Total Time Saved: ${summary.totalTime}ms\n`;
    
    if (summary.fastestLoad) {
      report += `Fastest Load: ${summary.fastestLoad.component} (${summary.fastestLoad.time.toFixed(2)}ms)\n`;
    }
    
    if (summary.slowestLoad) {
      report += `Slowest Load: ${summary.slowestLoad.component} (${summary.slowestLoad.time.toFixed(2)}ms)\n`;
    }
    
    report += '\n--- Component Details ---\n';
    Object.entries(allMetrics).forEach(([name, metrics]) => {
      const loadTime = metrics.loadEnd && metrics.loadStart 
        ? metrics.loadEnd - metrics.loadStart 
        : 0;
      const renderTime = metrics.renderEnd && metrics.renderStart 
        ? metrics.renderEnd - metrics.renderStart 
        : 0;
      
      report += `${name}:\n`;
      report += `  Load Time: ${loadTime.toFixed(2)}ms\n`;
      report += `  Render Time: ${renderTime.toFixed(2)}ms\n`;
      report += `  Cached: ${metrics.cached ? 'Yes' : 'No'}\n\n`;
    });
    
    report += '================================================\n';
    
    return report;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.lazyLoadMetrics.clear();
    this.loadStartTimes.clear();
    console.log('[Performance] All metrics cleared');
  }

  /**
   * Mark a component as cached (preloaded)
   */
  markCached(componentName: string): void {
    const existing = this.lazyLoadMetrics.get(componentName);
    if (existing) {
      existing.cached = true;
      console.log(`[Performance] ${componentName} marked as cached`);
    }
  }
}

// Create singleton instance
export const performanceTracker = new PerformanceTracker();

// Export hook for React components
export const usePerformanceTracking = (componentName: string) => {
  const startTracking = () => performanceTracker.startTracking(componentName);
  const markLoadStart = () => performanceTracker.markLoadStart(componentName);
  const markLoadEnd = () => performanceTracker.markLoadEnd(componentName);
  const markRenderStart = () => performanceTracker.markRenderStart(componentName);
  const markRenderEnd = () => performanceTracker.markRenderEnd(componentName);
  const recordMemoryUsage = () => performanceTracker.recordMemoryUsage(componentName);
  
  return {
    startTracking,
    markLoadStart,
    markLoadEnd,
    markRenderStart,
    markRenderEnd,
    recordMemoryUsage
  };
};

export default performanceTracker;