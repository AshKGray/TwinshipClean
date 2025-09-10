import { useCallback, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { useSubscriptionStore } from "../state/subscriptionStore";
import { PREMIUM_FEATURES } from "../types/premium/subscription";

/**
 * Hook for managing premium feature access and upgrade flow
 */
export const usePremiumFeatures = () => {
  const navigation = useNavigation();
  const {
    subscriptionInfo,
    hasAccessTo,
    canAccessFeature,
    getPremiumUpsellData,
    trackConversionEvent,
    syncSubscriptionStatus
  } = useSubscriptionStore();
  
  // Sync subscription status on mount
  useEffect(() => {
    syncSubscriptionStatus();
  }, []);

  const navigateToUpgrade = useCallback((featureId?: string, source?: string) => {
    trackConversionEvent('upgrade_flow_started', { featureId, source });
    
    navigation.navigate('Premium' as never, { 
      feature: featureId, 
      source: source || 'feature_gate' 
    } as never);
  }, [navigation, trackConversionEvent]);

  const checkFeatureAccess = useCallback((featureId: string) => {
    return {
      hasAccess: hasAccessTo(featureId),
      canAccess: canAccessFeature(featureId),
      upsellInfo: getPremiumUpsellData(featureId)
    };
  }, [hasAccessTo, canAccessFeature, getPremiumUpsellData]);

  const requirePremiumAccess = useCallback((
    featureId: string,
    onUpgrade?: () => void,
    source?: string
  ): boolean => {
    const hasAccess = hasAccessTo(featureId);
    
    if (!hasAccess) {
      trackConversionEvent('feature_blocked', { featureId, source });
      
      if (onUpgrade) {
        onUpgrade();
      } else {
        navigateToUpgrade(featureId, source);
      }
      
      return false;
    }
    
    return true;
  }, [hasAccessTo, navigateToUpgrade, trackConversionEvent]);

  const getFeatureInfo = useCallback((featureId: string) => {
    return PREMIUM_FEATURES.find(f => f.id === featureId);
  }, []);

  const getPremiumFeaturesByCategory = useCallback((category: string) => {
    return PREMIUM_FEATURES.filter(f => f.category === category);
  }, []);

  const isSubscriptionActive = subscriptionInfo.isActive;
  const subscriptionPlan = subscriptionInfo.plan;
  const subscriptionStatus = subscriptionInfo.status;

  return {
    // Subscription info
    isSubscriptionActive,
    subscriptionPlan,
    subscriptionStatus,
    subscriptionInfo,
    
    // Feature access
    hasAccessTo,
    canAccessFeature,
    checkFeatureAccess,
    requirePremiumAccess,
    
    // Feature info
    getFeatureInfo,
    getPremiumFeaturesByCategory,
    
    // Navigation
    navigateToUpgrade,
    
    // Upsell
    getPremiumUpsellData
  };
};

/**
 * Hook for assessment-specific premium features
 */
export const useAssessmentPremium = () => {
  const premium = usePremiumFeatures();
  
  const canViewDetailedResults = premium.hasAccessTo('detailed_results');
  const canExportPDF = premium.hasAccessTo('pdf_export');
  const canAccessCoaching = premium.hasAccessTo('coaching_plans');
  const canViewAnalytics = premium.hasAccessTo('twin_analytics');
  const canGetRecommendations = premium.hasAccessTo('recommendations');
  
  const requireDetailedResults = (onUpgrade?: () => void) => 
    premium.requirePremiumAccess('detailed_results', onUpgrade, 'assessment');
  
  const requirePDFExport = (onUpgrade?: () => void) => 
    premium.requirePremiumAccess('pdf_export', onUpgrade, 'assessment');
    
  const requireCoachingPlans = (onUpgrade?: () => void) => 
    premium.requirePremiumAccess('coaching_plans', onUpgrade, 'assessment');
  
  return {
    ...premium,
    canViewDetailedResults,
    canExportPDF,
    canAccessCoaching,
    canViewAnalytics,
    canGetRecommendations,
    requireDetailedResults,
    requirePDFExport,
    requireCoachingPlans
  };
};

/**
 * Hook for analytics-specific premium features
 */
export const useAnalyticsPremium = () => {
  const premium = usePremiumFeatures();
  
  const canViewAdvancedAnalytics = premium.hasAccessTo('twin_analytics');
  const canRetakeAssessments = premium.hasAccessTo('unlimited_assessments');
  
  const requireAdvancedAnalytics = (onUpgrade?: () => void) => 
    premium.requirePremiumAccess('twin_analytics', onUpgrade, 'dashboard');
    
  const requireUnlimitedRetakes = (onUpgrade?: () => void) => 
    premium.requirePremiumAccess('unlimited_assessments', onUpgrade, 'dashboard');
  
  return {
    ...premium,
    canViewAdvancedAnalytics,
    canRetakeAssessments,
    requireAdvancedAnalytics,
    requireUnlimitedRetakes
  };
};