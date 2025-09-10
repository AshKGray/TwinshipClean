#!/bin/bash

# BMAD Method Installation Script for Twinship App
echo "Installing BMAD Method for Twinship App..."

# Create .bmad directory structure
mkdir -p .bmad-core/{agents,workflows,metrics,config}
mkdir -p .bmad-mobile-app/{screens,components,services}

# Create BMAD configuration file
cat > .bmad-core/config/bmad.config.json << 'EOF'
{
  "projectName": "Twinship",
  "projectType": "mobile-app",
  "framework": "react-native-expo",
  "version": "4.42.1",
  "ide": ["claude-code"],
  "features": {
    "build": true,
    "measure": true,
    "analyze": true,
    "deploy": true
  },
  "metrics": {
    "performance": {
      "enabled": true,
      "thresholds": {
        "loadTime": 3000,
        "renderTime": 16,
        "memoryUsage": 150
      }
    },
    "userEngagement": {
      "enabled": true,
      "tracking": ["sessions", "interactions", "retention"]
    },
    "quality": {
      "enabled": true,
      "rules": ["eslint", "typescript", "testing"]
    }
  },
  "navigation": {
    "tracking": true,
    "analytics": true,
    "errorBoundaries": true
  },
  "agents": [
    "mobile-dev",
    "performance-analyzer",
    "ux-optimizer",
    "test-automation",
    "deployment-manager"
  ]
}
EOF

# Create BMAD workflow templates
cat > .bmad-core/workflows/build-measure-analyze-deploy.yaml << 'EOF'
name: BMAD Workflow
version: 1.0.0

phases:
  - name: BUILD
    steps:
      - validate_code
      - run_tests
      - build_app
      - optimize_bundle
    
  - name: MEASURE
    steps:
      - collect_metrics
      - track_performance
      - monitor_usage
      - gather_feedback
    
  - name: ANALYZE
    steps:
      - process_metrics
      - identify_patterns
      - generate_insights
      - create_reports
    
  - name: DEPLOY
    steps:
      - prepare_release
      - deploy_staging
      - run_smoke_tests
      - deploy_production
EOF

# Create mobile-specific BMAD agents
cat > .bmad-mobile-app/mobile-performance.agent.js << 'EOF'
/**
 * BMAD Mobile Performance Agent
 * Monitors and optimizes React Native app performance
 */

export class MobilePerformanceAgent {
  constructor() {
    this.metrics = {
      fps: [],
      memory: [],
      renderTime: [],
      apiLatency: []
    };
  }

  measure(metricType, value) {
    if (this.metrics[metricType]) {
      this.metrics[metricType].push({
        value,
        timestamp: Date.now()
      });
    }
  }

  analyze() {
    const analysis = {};
    for (const [key, values] of Object.entries(this.metrics)) {
      if (values.length > 0) {
        analysis[key] = {
          average: values.reduce((a, b) => a + b.value, 0) / values.length,
          min: Math.min(...values.map(v => v.value)),
          max: Math.max(...values.map(v => v.value)),
          count: values.length
        };
      }
    }
    return analysis;
  }

  getRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.fps && analysis.fps.average < 55) {
      recommendations.push({
        severity: 'high',
        message: 'FPS below optimal threshold',
        action: 'Review render methods and optimize re-renders'
      });
    }
    
    if (analysis.memory && analysis.memory.max > 150) {
      recommendations.push({
        severity: 'medium',
        message: 'High memory usage detected',
        action: 'Check for memory leaks and optimize image handling'
      });
    }
    
    return recommendations;
  }
}
EOF

# Create navigation integration
cat > .bmad-mobile-app/navigation-tracker.ts << 'EOF'
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
EOF

# Create README for BMAD
cat > .bmad-core/README.md << 'EOF'
# BMAD Method - Twinship App

## Overview
BMAD (Build, Measure, Analyze, Deploy) is a comprehensive development methodology installed for the Twinship app.

## Core Principles

### 1. BUILD
- Rapid prototyping with React Native/Expo
- Component-driven development
- Test-driven approach

### 2. MEASURE
- Performance metrics (FPS, Memory, Load times)
- User engagement tracking
- Navigation analytics
- Feature usage statistics

### 3. ANALYZE
- Data-driven insights
- Pattern recognition
- User behavior analysis
- Performance bottleneck identification

### 4. DEPLOY
- Continuous deployment pipeline
- A/B testing framework
- Staged rollouts
- Rollback capabilities

## Quick Start

```bash
# Run BMAD build phase
npm run bmad:build

# Collect metrics
npm run bmad:measure

# Generate analysis report
npm run bmad:analyze

# Deploy to staging
npm run bmad:deploy:staging
```

## Integration with Twinship

The BMAD method is integrated with:
- Navigation system (AppNavigator.tsx)
- Performance monitoring
- User analytics
- Deployment pipeline

## Agents

- **mobile-dev**: Mobile development optimization
- **performance-analyzer**: Performance monitoring and optimization
- **ux-optimizer**: User experience improvements
- **test-automation**: Automated testing workflows
- **deployment-manager**: Deployment orchestration

## Metrics Dashboard

Access the BMAD metrics dashboard:
```bash
npm run bmad:dashboard
```

## Configuration

Edit `.bmad-core/config/bmad.config.json` to customize:
- Performance thresholds
- Tracking preferences
- Agent configurations
- Deployment settings
EOF

echo "✅ BMAD Method installation complete!"
echo ""
echo "📁 Created directories:"
echo "  - .bmad-core/ (core system)"
echo "  - .bmad-mobile-app/ (mobile-specific tools)"
echo ""
echo "📝 Next steps:"
echo "  1. Review .bmad-core/config/bmad.config.json"
echo "  2. Integrate navigation tracker with AppNavigator.tsx"
echo "  3. Set up performance monitoring"
echo "  4. Configure deployment pipeline"