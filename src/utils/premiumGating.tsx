/**
 * Premium Feature Gating Utilities
 * 
 * This file provides utility functions for implementing premium feature gating
 * throughout the Twinship app in a consistent way.
 */

import React from "react";
import { Alert } from "react-native";
import { PREMIUM_FEATURES } from "../types/premium/subscription";

/**
 * Show premium upgrade alert with feature-specific messaging
 */
export const showPremiumUpgradeAlert = (
  featureId: string,
  onUpgrade: () => void,
  onCancel?: () => void
) => {
  const feature = PREMIUM_FEATURES.find(f => f.id === featureId);
  const featureName = feature?.name || "this feature";
  const description = feature?.teaser?.content || feature?.description || "premium functionality";

  Alert.alert(
    "Premium Feature",
    `${featureName} requires a Premium subscription.\n\n${description}`,
    [
      {
        text: "Not Now",
        style: "cancel",
        onPress: onCancel
      },
      {
        text: "Unlock the full analysis of your Twinship",
        style: "default",
        onPress: onUpgrade
      }
    ]
  );
};

/**
 * Get appropriate teaser content for locked features
 */
export const getPremiumTeaserContent = (featureId: string) => {
  const feature = PREMIUM_FEATURES.find(f => f.id === featureId);
  
  const teasers: Record<string, { preview: any; description: string }> = {
    detailed_results: {
      preview: {
        personalityScores: [85, 72, 91, 68, 77],
        twinDynamicsScore: 82,
        codependencyIndex: 45,
        autonomyScore: 78
      },
      description: "See your complete personality breakdown and twin-specific metrics"
    },
    
    coaching_plans: {
      preview: {
        weeklyTasks: [
          "Practice individual reflection time",
          "Express appreciation for twin's uniqueness", 
          "Set one personal boundary this week"
        ],
        estimatedTime: "15 min/day"
      },
      description: "Get personalized weekly exercises to strengthen your bond"
    },
    
    twin_analytics: {
      preview: {
        syncScore: 87,
        communicationTrend: "↗️ +12% this month",
        conflictResolution: "Strong",
        growthAreas: 2
      },
      description: "Track your relationship progress with detailed analytics"
    },
    
    astrology_birthchart: {
      preview: {
        sunSign: "Gemini ♊",
        moonSign: "Pisces ♓", 
        rising: "Scorpio ♏",
        dominantElement: "Water",
        twinSynastry: "92% compatibility"
      },
      description: "Get your complete birth chart with twin synastry analysis"
    },
    
    numerology_reading: {
      preview: {
        lifePath: "7 - The Seeker",
        soulUrge: "3 - Creative Expression",
        personality: "4 - The Builder",
        twinConnection: "Master Number 11"
      },
      description: "Discover your numerology profile and twin number connections"
    },
    
    recommendations: {
      preview: {
        topRecommendation: "Focus on individual identity development",
        confidence: "92%",
        personalizedTips: 5
      },
      description: "AI analyzes your results to provide tailored relationship advice"
    },
    
    unlimited_assessments: {
      preview: {
        nextRetake: "Available now",
        lastScore: 78,
        improvement: "+8 points"
      },
      description: "Retake assessments monthly to track your growth journey"
    }
  };

  return {
    teaser: teasers[featureId] || { preview: null, description: feature?.description || "" },
    feature
  };
};

/**
 * Feature gating decorator for components
 */
export const withPremiumGating = <T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  featureId: string
) => {
  return (props: T & { hasAccess?: boolean; onUpgrade?: () => void }) => {
    const { hasAccess = false, onUpgrade, ...componentProps } = props;
    
    if (hasAccess) {
      return <Component {...(componentProps as T)} />;
    }
    
    // Return gated version - could be teaser, blur overlay, etc.
    return null;
  };
};

/**
 * Premium feature access levels
 */
export const PREMIUM_ACCESS_LEVELS = {
  FREE: 'free',
  PREMIUM: 'premium'
} as const;

/**
 * Map features to their required access level
 */
export const FEATURE_ACCESS_MAP = {
  // Free features
  basic_results: PREMIUM_ACCESS_LEVELS.FREE,
  twin_pairing: PREMIUM_ACCESS_LEVELS.FREE,
  chat: PREMIUM_ACCESS_LEVELS.FREE,
  games: PREMIUM_ACCESS_LEVELS.FREE,
  stories: PREMIUM_ACCESS_LEVELS.FREE,
  basic_twintuition: PREMIUM_ACCESS_LEVELS.FREE,
  
  // Premium features
  detailed_results: PREMIUM_ACCESS_LEVELS.PREMIUM,
  coaching_plans: PREMIUM_ACCESS_LEVELS.PREMIUM,
  astrology_birthchart: PREMIUM_ACCESS_LEVELS.PREMIUM,
  numerology_reading: PREMIUM_ACCESS_LEVELS.PREMIUM,
  twin_analytics: PREMIUM_ACCESS_LEVELS.PREMIUM,
  recommendations: PREMIUM_ACCESS_LEVELS.PREMIUM,
  unlimited_assessments: PREMIUM_ACCESS_LEVELS.PREMIUM
} as const;

/**
 * Check if a feature requires premium access
 */
export const requiresPremium = (featureId: string): boolean => {
  return FEATURE_ACCESS_MAP[featureId as keyof typeof FEATURE_ACCESS_MAP] === PREMIUM_ACCESS_LEVELS.PREMIUM;
};

/**
 * Premium feature categories for organizing upsells
 */
export const PREMIUM_CATEGORIES = {
  ASSESSMENT: {
    id: 'assessment',
    name: 'Assessment & Analysis',
    description: 'Deep insights into your twin bond',
    icon: 'analytics',
    features: ['detailed_results', 'unlimited_assessments']
  },
  
  COACHING: {
    id: 'coaching', 
    name: 'Personal Growth',
    description: 'Guided exercises for stronger bonds',
    icon: 'fitness',
    features: ['coaching_plans']
  },
  
  ANALYTICS: {
    id: 'analytics',
    name: 'Progress Tracking',
    description: 'Monitor your twin journey',
    icon: 'stats-chart', 
    features: ['twin_analytics']
  },
  
  MYSTICAL: {
    id: 'mystical',
    name: 'Mystical Insights', 
    description: 'Astrology charts and numerology readings for your twin bond',
    icon: 'planet',
    features: ['astrology_birthchart', 'numerology_reading']
  },
  
  INSIGHTS: {
    id: 'insights',
    name: 'AI Intelligence',
    description: 'Smart recommendations for your relationship',
    icon: 'bulb',
    features: ['recommendations']
  }
} as const;

/**
 * Get category for a feature
 */
export const getFeatureCategory = (featureId: string) => {
  return Object.values(PREMIUM_CATEGORIES).find(
    category => category.features.includes(featureId)
  );
};

/**
 * Analytics events for premium feature interactions
 */
export const PREMIUM_ANALYTICS_EVENTS = {
  FEATURE_VIEWED: 'premium_feature_viewed',
  FEATURE_BLOCKED: 'premium_feature_blocked', 
  UPGRADE_PROMPT_SHOWN: 'premium_upgrade_prompt_shown',
  UPGRADE_CLICKED: 'premium_upgrade_clicked',
  PAYWALL_VIEWED: 'premium_paywall_viewed',
  PURCHASE_INITIATED: 'premium_purchase_initiated',
  PURCHASE_COMPLETED: 'premium_purchase_completed',
  PURCHASE_FAILED: 'premium_purchase_failed'
} as const;