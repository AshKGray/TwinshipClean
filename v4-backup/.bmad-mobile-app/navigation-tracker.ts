/**
 * BMAD Navigation Tracker
 * Integrates with React Navigation for analytics
 */

import { NavigationContainerRef } from '@react-navigation/native';

export class BMadNavigationTracker {
  private routeHistory: Array<{
    name: string;
    timestamp: number;
    params?: any;
  }> = [];

  private metrics = {
    screenViews: new Map<string, number>(),
    navigationTime: new Map<string, number[]>(),
    userFlows: []
  };

  trackScreenView(routeName: string, params?: any) {
    // Track screen view
    this.routeHistory.push({
      name: routeName,
      timestamp: Date.now(),
      params
    });

    // Update metrics
    const views = this.metrics.screenViews.get(routeName) || 0;
    this.metrics.screenViews.set(routeName, views + 1);
  }

  trackNavigationTime(from: string, to: string, duration: number) {
    const key = `${from}->${to}`;
    const times = this.metrics.navigationTime.get(key) || [];
    times.push(duration);
    this.metrics.navigationTime.set(key, times);
  }

  getNavigationAnalytics() {
    const popularScreens = Array.from(this.metrics.screenViews.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const avgNavigationTimes = new Map();
    this.metrics.navigationTime.forEach((times, route) => {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      avgNavigationTimes.set(route, avg);
    });

    return {
      popularScreens,
      avgNavigationTimes,
      totalScreenViews: Array.from(this.metrics.screenViews.values())
        .reduce((a, b) => a + b, 0),
      uniqueScreens: this.metrics.screenViews.size
    };
  }

  exportMetrics() {
    return {
      history: this.routeHistory,
      metrics: {
        screenViews: Object.fromEntries(this.metrics.screenViews),
        navigationTime: Object.fromEntries(this.metrics.navigationTime),
        userFlows: this.metrics.userFlows
      }
    };
  }
}
