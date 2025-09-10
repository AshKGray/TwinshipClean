import React, { ReactNode } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

import { PremiumFeatureTeaser } from "./PremiumFeatureTeaser";
import { usePremiumFeatures } from "../../hooks/usePremiumFeatures";
import { PREMIUM_FEATURES } from "../../types/premium/subscription";
import { useTwinStore } from "../../state/twinStore";
import { getNeonAccentColor } from "../../utils/neonColors";

interface PremiumGatedContentProps {
  featureId: string;
  children: ReactNode;
  fallbackComponent?: ReactNode;
  gateType?: "teaser" | "blur" | "overlay" | "replacement";
  showPreview?: boolean;
  customMessage?: string;
  onUpgradeRequest?: () => void;
}

/**
 * Component that gates content behind premium subscription
 * Automatically handles display logic based on user's subscription status
 */
export const PremiumGatedContent: React.FC<PremiumGatedContentProps> = ({
  featureId,
  children,
  fallbackComponent,
  gateType = "teaser",
  showPreview = true,
  customMessage,
  onUpgradeRequest
}) => {
  const { hasAccessTo, navigateToUpgrade } = usePremiumFeatures();
  const userProfile = useTwinStore((state) => state.userProfile);
  const accentColor = userProfile?.accentColor || "neon-purple";
  const neonColor = getNeonAccentColor(accentColor);
  
  const hasAccess = hasAccessTo(featureId);
  const feature = PREMIUM_FEATURES.find(f => f.id === featureId);

  const handleUpgrade = () => {
    if (onUpgradeRequest) {
      onUpgradeRequest();
    } else {
      navigateToUpgrade(featureId, 'gated_content');
    }
  };

  // If user has access, show content normally
  if (hasAccess) {
    return <>{children}</>;
  }

  // If no feature found, show error state
  if (!feature) {
    console.warn(`Premium feature not found: ${featureId}`);
    return <>{children}</>;
  }

  // Handle different gate types
  switch (gateType) {
    case "blur":
      return (
        <View className="relative">
          <BlurView intensity={80} className="absolute inset-0 z-10">
            <View className="flex-1 items-center justify-center bg-black/30">
              <TouchableOpacity
                onPress={handleUpgrade}
                style={{ backgroundColor: neonColor }}
                className="px-6 py-3 rounded-full flex-row items-center"
              >
                <Ionicons name="star" size={16} color="black" />
                <Text className="text-black font-bold ml-2">
                  Unlock Premium
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>
          {children}
        </View>
      );

    case "overlay":
      return (
        <View className="relative">
          <View className="opacity-30">
            {children}
          </View>
          <View className="absolute inset-0 items-center justify-center bg-black/50">
            <View 
              className="p-6 rounded-2xl border items-center max-w-sm"
              style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: neonColor 
              }}
            >
              <Ionicons name="lock-closed" size={32} color={neonColor} />
              <Text className="text-white font-bold text-lg mt-3 text-center">
                Premium Feature
              </Text>
              <Text className="text-gray-400 text-sm mt-2 text-center">
                {customMessage || feature.description}
              </Text>
              <TouchableOpacity
                onPress={handleUpgrade}
                style={{ backgroundColor: neonColor }}
                className="mt-4 px-4 py-2 rounded-full"
              >
                <Text className="text-black font-bold">Upgrade</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );

    case "replacement":
      if (fallbackComponent) {
        return <>{fallbackComponent}</>;
      }
      return (
        <View 
          className="p-8 rounded-2xl border-2 border-dashed items-center"
          style={{ borderColor: neonColor }}
        >
          <Ionicons name="star-outline" size={48} color={neonColor} />
          <Text className="text-white font-bold text-lg mt-4 text-center">
            {feature.name}
          </Text>
          <Text className="text-gray-400 text-sm mt-2 text-center">
            {customMessage || feature.description}
          </Text>
          <TouchableOpacity
            onPress={handleUpgrade}
            style={{ backgroundColor: neonColor }}
            className="mt-4 px-6 py-3 rounded-full"
          >
            <Text className="text-black font-bold">Unlock Now</Text>
          </TouchableOpacity>
        </View>
      );

    case "teaser":
    default:
      return (
        <PremiumFeatureTeaser
          feature={feature}
          onUpgrade={handleUpgrade}
          showPreview={showPreview}
          customMessage={customMessage}
        >
          {children}
        </PremiumFeatureTeaser>
      );
  }
};

/**
 * Simpler wrapper for components that should be completely hidden if not premium
 */
export const PremiumOnly: React.FC<{ featureId: string; children: ReactNode }> = ({
  featureId,
  children
}) => {
  const { hasAccessTo } = usePremiumFeatures();
  
  if (hasAccessTo(featureId)) {
    return <>{children}</>;
  }
  
  return null;
};

/**
 * Component that shows different content for free vs premium users
 */
export const PremiumConditional: React.FC<{
  featureId: string;
  freeContent: ReactNode;
  premiumContent: ReactNode;
}> = ({
  featureId,
  freeContent,
  premiumContent
}) => {
  const { hasAccessTo } = usePremiumFeatures();
  
  return <>{hasAccessTo(featureId) ? premiumContent : freeContent}</>;
};