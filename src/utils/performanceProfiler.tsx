import React, { Profiler, ProfilerOnRenderCallback, ReactNode } from 'react';

// Performance data storage
interface PerformanceMetrics {
  id: string;
  phase: 'mount' | 'update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  interactions: Set<any>;
  renderCount: number;
  averageDuration: number;
  maxDuration: number;
  minDuration: number;
}

// In-memory storage for performance metrics
const performanceData: Map<string, PerformanceMetrics> = new Map();

// Callback for React Profiler
const onRenderCallback = (
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number,
  interactions: Set<any>
) => {
  // Get existing metrics or create new ones
  const existing = performanceData.get(id) || {
    id,
    phase,
    actualDuration: 0,
    baseDuration: 0,
    startTime,
    commitTime,
    interactions,
    renderCount: 0,
    averageDuration: 0,
    maxDuration: 0,
    minDuration: Infinity,
  };

  // Update metrics
  const renderCount = existing.renderCount + 1;
  const totalDuration = existing.averageDuration * existing.renderCount + actualDuration;
  const averageDuration = totalDuration / renderCount;
  const maxDuration = Math.max(existing.maxDuration, actualDuration);
  const minDuration = Math.min(existing.minDuration, actualDuration);

  // Store updated metrics
  performanceData.set(id, {
    ...existing,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
    interactions,
    renderCount,
    averageDuration,
    maxDuration,
    minDuration,
  });

  // Log in development mode
  if (__DEV__) {
    // Only log slow renders (>16ms for 60fps)
    if (actualDuration > 16) {
      console.warn(
        `⚠️ Slow Render: ${id} (${phase})`,
        `Duration: ${actualDuration.toFixed(2)}ms`,
        `Renders: ${renderCount}`,
        `Avg: ${averageDuration.toFixed(2)}ms`
      );
    }
  }
};

// Component wrapper for profiling
interface ProfiledComponentProps {
  id: string;
  children: ReactNode;
  enabled?: boolean;
}

export const ProfiledComponent: React.FC<ProfiledComponentProps> = ({
  id,
  children,
  enabled = __DEV__, // Only enable in development by default
}) => {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <Profiler id={id} onRender={onRenderCallback}>
      {children}
    </Profiler>
  );
};

// Utility functions for accessing performance data
export const PerformanceUtils = {
  // Get metrics for a specific component
  getMetrics(id: string): PerformanceMetrics | undefined {
    return performanceData.get(id);
  },

  // Get all metrics
  getAllMetrics(): Map<string, PerformanceMetrics> {
    return performanceData;
  },

  // Get slow components (>16ms average)
  getSlowComponents(): PerformanceMetrics[] {
    return Array.from(performanceData.values())
      .filter(metric => metric.averageDuration > 16)
      .sort((a, b) => b.averageDuration - a.averageDuration);
  },

  // Get frequently re-rendering components
  getFrequentRenders(threshold = 10): PerformanceMetrics[] {
    return Array.from(performanceData.values())
      .filter(metric => metric.renderCount > threshold)
      .sort((a, b) => b.renderCount - a.renderCount);
  },

  // Clear all metrics
  clearMetrics(): void {
    performanceData.clear();
  },

  // Generate performance report
  generateReport(): string {
    const slowComponents = this.getSlowComponents();
    const frequentRenders = this.getFrequentRenders();

    let report = '📊 Performance Report\n';
    report += '====================\n\n';

    if (slowComponents.length > 0) {
      report += '🐌 Slow Components (>16ms avg):\n';
      slowComponents.forEach(metric => {
        report += `  - ${metric.id}: ${metric.averageDuration.toFixed(2)}ms avg, ${metric.renderCount} renders\n`;
      });
      report += '\n';
    }

    if (frequentRenders.length > 0) {
      report += '🔄 Frequent Re-renders (>10):\n';
      frequentRenders.forEach(metric => {
        report += `  - ${metric.id}: ${metric.renderCount} renders, ${metric.averageDuration.toFixed(2)}ms avg\n`;
      });
      report += '\n';
    }

    report += `📈 Total Components Tracked: ${performanceData.size}\n`;

    return report;
  },

  // Log performance report to console
  logReport(): void {
    console.log(this.generateReport());
  },
};

// HOC for easy profiling
export function withProfiler<P extends object>(
  Component: React.ComponentType<P>,
  profileId: string
): React.FC<P> {
  return (props: P) => (
    <ProfiledComponent id={profileId}>
      <Component {...props} />
    </ProfiledComponent>
  );
}

// Custom hook for performance monitoring
export function usePerformanceMonitor(componentId: string) {
  React.useEffect(() => {
    // Log initial mount
    if (__DEV__) {
      console.log(`🔍 Monitoring: ${componentId}`);
    }

    return () => {
      // Log metrics on unmount
      if (__DEV__) {
        const metrics = performanceData.get(componentId);
        if (metrics && metrics.renderCount > 5) {
          console.log(
            `📊 ${componentId} Performance:`,
            `Renders: ${metrics.renderCount},`,
            `Avg: ${metrics.averageDuration.toFixed(2)}ms,`,
            `Max: ${metrics.maxDuration.toFixed(2)}ms`
          );
        }
      }
    };
  }, [componentId]);
}