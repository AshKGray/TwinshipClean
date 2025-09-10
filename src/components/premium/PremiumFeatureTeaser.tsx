import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTwinStore } from "../../state/twinStore";
import { useSubscriptionStore } from "../../state/subscriptionStore";
import { getNeonAccentColor } from "../../utils/neonColors";
import { PremiumFeature } from "../../types/premium/subscription";

interface PremiumFeatureTeaserProps {
  feature: PremiumFeature;
  onUpgrade: () => void;
  children?: React.ReactNode;
  showPreview?: boolean;
  customMessage?: string;
}

export const PremiumFeatureTeaser: React.FC<PremiumFeatureTeaserProps> = ({
  feature,
  onUpgrade,
  children,
  showPreview = true,
  customMessage
}) => {
  const userProfile = useTwinStore((state) => state.userProfile);
  const hasAccessTo = useSubscriptionStore((state) => state.hasAccessTo);
  const trackConversionEvent = useSubscriptionStore((state) => state.trackConversionEvent);
  
  const accentColor = userProfile?.accentColor || "neon-purple";
  const neonColor = getNeonAccentColor(accentColor);

  const hasAccess = hasAccessTo(feature.id);

  const handleUpgradePress = () => {
    trackConversionEvent('feature_teaser_upgrade_clicked', { 
      featureId: feature.id,
      featureName: feature.name 
    });
    onUpgrade();
  };

  // If user has access, just render children
  if (hasAccess) {
    return <>{children}</>;
  }

  const getFeatureIcon = (iconName: string) => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      analytics: "analytics",
      fitness: "fitness",
      "document-text": "document-text",
      "stats-chart": "stats-chart",
      bulb: "bulb",
      refresh: "refresh"
    };
    return iconMap[iconName] || "star";
  };

  return (
    <View className="relative">
      {/* Blurred/Dimmed Content */}
      {children && (
        <View className="opacity-30 blur-sm">
          {children}
        </View>
      )}

      {/* Overlay */}
      <LinearGradient
        colors={[
          'rgba(0, 0, 0, 0.8)',
          'rgba(0, 0, 0, 0.9)',
          'rgba(0, 0, 0, 0.8)'
        ]}
        className="absolute inset-0 items-center justify-center p-6 rounded-2xl"
      >
        {/* Premium badge */}
        <View 
          className="px-3 py-1 rounded-full mb-4"
          style={{ backgroundColor: `${neonColor}20`, borderColor: neonColor, borderWidth: 1 }}
        >
          <Text 
            className="text-xs font-bold"
            style={{ color: neonColor }}
          >
            PREMIUM FEATURE
          </Text>
        </View>

        {/* Feature icon */}
        <View 
          className="w-16 h-16 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: `${neonColor}20` }}
        >
          <Ionicons 
            name={getFeatureIcon(feature.icon)} 
            size={32} 
            color={neonColor} 
          />
        </View>

        {/* Content */}
        <Text className="text-white text-xl font-bold text-center mb-2">
          {feature.teaser?.title || feature.name}
        </Text>
        
        <Text className="text-gray-300 text-center text-sm mb-6 px-4">
          {customMessage || feature.teaser?.content || feature.description}
        </Text>

        {/* Preview content if available */}
        {showPreview && feature.teaser?.preview && (
          <View 
            className="mb-6 p-4 rounded-xl border-l-4 w-full max-w-sm"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderLeftColor: neonColor 
            }}
          >
            <Text className="text-gray-400 text-xs mb-1">PREVIEW</Text>
            {feature.teaser.preview}
          </View>
        )}

        {/* Upgrade Button */}
        <TouchableOpacity
          onPress={handleUpgradePress}
          style={{ backgroundColor: neonColor }}
          className="py-3 px-8 rounded-full"
        >
          <View className="flex-row items-center">
            <Ionicons name="star" size={16} color="black" />
            <Text className="text-black font-bold ml-2">
              Unlock the full analysis of your Twinship
            </Text>
          </View>
        </TouchableOpacity>

        {/* Small legal text */}
        <Text className="text-gray-500 text-xs text-center mt-4">
          Start your free trial today
        </Text>
      </LinearGradient>
    </View>
  );
};

// Higher-order component for easy feature gating
export const withPremiumGate = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: PremiumFeature,
  onUpgrade: () => void
) => {
  return (props: P) => {
    const hasAccessTo = useSubscriptionStore((state) => state.hasAccessTo);
    
    if (hasAccessTo(feature.id)) {
      return <WrappedComponent {...props} />;
    }
    
    return (
      <PremiumFeatureTeaser feature={feature} onUpgrade={onUpgrade}>
        <WrappedComponent {...props} />
      </PremiumFeatureTeaser>
    );
  };
};