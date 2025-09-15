/**
 * Performance Dashboard for Startup and Runtime Monitoring
 * Integrates with BMAD and provides comprehensive performance insights
 */

import { performanceTracker } from './performanceTracker';

interface DashboardMetrics {
  startup: {
    totalTime: number;
    firstRender: number;
    navigationReady: number;
    criticalResourcesLoaded: number;
    budgetViolations: string[];
    isWithinBudget: boolean;
  };
  runtime: {
    memoryUsage: number;
    fps: number;
    renderTime: number;
    navigationLatency: number;
  };
  recommendations: string[];
  score: number; // Overall performance score (0-100)
}

export class PerformanceDashboard {
  private static instance: PerformanceDashboard;
  private metricsHistory: DashboardMetrics[] = [];

  static getInstance(): PerformanceDashboard {
    if (!PerformanceDashboard.instance) {
      PerformanceDashboard.instance = new PerformanceDashboard();
    }
    return PerformanceDashboard.instance;
  }

  /**
   * Generate current performance dashboard
   */
  generateDashboard(): DashboardMetrics {
    const startupReport = performanceTracker.generateStartupReport();
    const budgetStatus = startupReport.budget;

    const metrics: DashboardMetrics = {
      startup: {
        totalTime: startupReport.metrics.totalStartupTime || 0,
        firstRender: startupReport.timings.firstRender || 0,
        navigationReady: startupReport.timings.navigationReady || 0,
        criticalResourcesLoaded: startupReport.timings.criticalResourcesLoaded || 0,
        budgetViolations: budgetStatus.violations,
        isWithinBudget: budgetStatus.withinBudget,
      },
      runtime: {
        memoryUsage: this.getCurrentMemoryUsage(),
        fps: 60, // Would be updated from React Native Performance API
        renderTime: 16, // Would be measured from actual render times
        navigationLatency: 200, // Would be measured from navigation tracking
      },
      recommendations: startupReport.recommendations,
      score: this.calculatePerformanceScore(startupReport),
    };

    // Store in history
    this.metricsHistory.push(metrics);

    // Keep only last 10 entries
    if (this.metricsHistory.length > 10) {
      this.metricsHistory = this.metricsHistory.slice(-10);
    }

    return metrics;
  }

  /**
   * Calculate overall performance score (0-100)
   */
  private calculatePerformanceScore(startupReport: any): number {
    let score = 100;

    // Startup performance weight: 50%
    const { totalStartupTime } = startupReport.metrics;
    if (totalStartupTime) {
      if (totalStartupTime > 3000) score -= 30; // -30 for >3s startup
      else if (totalStartupTime > 2000) score -= 20; // -20 for >2s startup
      else if (totalStartupTime > 1500) score -= 10; // -10 for >1.5s startup
    }

    // Budget violations weight: 30%
    const violations = startupReport.budget.violations.length;
    score -= violations * 10; // -10 per violation

    // Memory usage weight: 20%
    const memoryUsage = this.getCurrentMemoryUsage();
    if (memoryUsage > 150) score -= 15; // High memory usage
    else if (memoryUsage > 100) score -= 10; // Medium memory usage

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get current memory usage (would integrate with React Native Performance API)
   */
  private getCurrentMemoryUsage(): number {
    try {
      if (typeof performance !== 'undefined' && (performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize / (1024 * 1024); // MB
      }
    } catch (error) {
      console.warn('[PerformanceDashboard] Memory API not available:', error);
    }
    return 0;
  }

  /**
   * Get performance trends over time
   */
  getTrends(): {
    startupTimes: number[];
    scores: number[];
    averageStartupTime: number;
    averageScore: number;
    improvementDirection: 'improving' | 'degrading' | 'stable';
  } {
    const startupTimes = this.metricsHistory.map(m => m.startup.totalTime).filter(t => t > 0);
    const scores = this.metricsHistory.map(m => m.score);

    const averageStartupTime = startupTimes.reduce((a, b) => a + b, 0) / (startupTimes.length || 1);
    const averageScore = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);

    // Determine trend direction
    let improvementDirection: 'improving' | 'degrading' | 'stable' = 'stable';
    if (scores.length >= 3) {
      const recent = scores.slice(-3);
      const older = scores.slice(-6, -3);

      if (older.length > 0) {
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

        if (recentAvg > olderAvg + 5) improvementDirection = 'improving';
        else if (recentAvg < olderAvg - 5) improvementDirection = 'degrading';
      }
    }

    return {
      startupTimes,
      scores,
      averageStartupTime,
      averageScore,
      improvementDirection,
    };
  }

  /**
   * Generate performance alerts
   */
  generateAlerts(): Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    action: string;
  }> {
    const alerts = [];
    const current = this.generateDashboard();

    // Critical startup time alert
    if (current.startup.totalTime > 5000) {
      alerts.push({
        severity: 'critical' as const,
        message: `Startup time is critically slow: ${current.startup.totalTime}ms`,
        action: 'Implement aggressive lazy loading and defer all non-critical services',
      });
    } else if (current.startup.totalTime > 3000) {
      alerts.push({
        severity: 'high' as const,
        message: `Startup time exceeds budget: ${current.startup.totalTime}ms`,
        action: 'Optimize critical path and defer heavy operations',
      });
    }

    // Budget violations
    if (current.startup.budgetViolations.length > 0) {
      alerts.push({
        severity: 'medium' as const,
        message: `Performance budget violations: ${current.startup.budgetViolations.length}`,
        action: 'Review and optimize identified performance bottlenecks',
      });
    }

    // Memory usage alerts
    if (current.runtime.memoryUsage > 200) {
      alerts.push({
        severity: 'high' as const,
        message: `High memory usage: ${current.runtime.memoryUsage.toFixed(1)}MB`,
        action: 'Check for memory leaks and optimize image/data caching',
      });
    }

    // Performance score alerts
    if (current.score < 50) {
      alerts.push({
        severity: 'high' as const,
        message: `Low performance score: ${current.score}/100`,
        action: 'Comprehensive performance audit and optimization needed',
      });
    } else if (current.score < 70) {
      alerts.push({
        severity: 'medium' as const,
        message: `Below-average performance score: ${current.score}/100`,
        action: 'Focus on startup optimization and memory management',
      });
    }

    return alerts;
  }

  /**
   * Export comprehensive dashboard data for external systems
   */
  exportDashboardData(): {
    current: DashboardMetrics;
    history: DashboardMetrics[];
    trends: ReturnType<typeof this.getTrends>;
    alerts: ReturnType<typeof this.generateAlerts>;
    timestamp: number;
  } {
    return {
      current: this.generateDashboard(),
      history: [...this.metricsHistory],
      trends: this.getTrends(),
      alerts: this.generateAlerts(),
      timestamp: Date.now(),
    };
  }

  /**
   * Log formatted dashboard to console
   */
  logDashboard(): void {
    const dashboard = this.exportDashboardData();

    console.log('\n📊 Performance Dashboard Report');
    console.log('================================');

    console.log('\n🚀 Startup Performance:');
    console.log(`   Total Time: ${dashboard.current.startup.totalTime}ms`);
    console.log(`   First Render: ${dashboard.current.startup.firstRender}ms`);
    console.log(`   Navigation Ready: ${dashboard.current.startup.navigationReady}ms`);
    console.log(`   Critical Resources: ${dashboard.current.startup.criticalResourcesLoaded}ms`);
    console.log(`   Budget Status: ${dashboard.current.startup.isWithinBudget ? '✅ Within Budget' : '❌ Budget Violations'}`);

    console.log('\n⚡ Runtime Performance:');
    console.log(`   Memory Usage: ${dashboard.current.runtime.memoryUsage.toFixed(1)}MB`);
    console.log(`   FPS: ${dashboard.current.runtime.fps}`);
    console.log(`   Render Time: ${dashboard.current.runtime.renderTime}ms`);

    console.log(`\n📈 Performance Score: ${dashboard.current.score}/100`);

    if (dashboard.alerts.length > 0) {
      console.log('\n⚠️  Performance Alerts:');
      dashboard.alerts.forEach((alert, index) => {
        const emoji = alert.severity === 'critical' ? '🔴' : alert.severity === 'high' ? '🟡' : '🟠';
        console.log(`   ${emoji} ${alert.message}`);
        console.log(`      → ${alert.action}`);
      });
    }

    if (dashboard.current.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      dashboard.current.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    console.log('\n================================\n');
  }
}

// Global dashboard instance
export const performanceDashboard = PerformanceDashboard.getInstance();

// Auto-generate dashboard report in development
if (process.env.NODE_ENV === 'development') {
  // Log dashboard every 30 seconds in development
  setInterval(() => {
    performanceDashboard.logDashboard();
  }, 30000);
}