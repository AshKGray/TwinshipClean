import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { PREMIUM_FEATURES, PremiumFeature } from "../../types/premium/subscription";
import { useTwinStore } from "../../state/twinStore";
import { useSubscriptionStore } from "../../state/subscriptionStore";
import { getNeonAccentColor } from "../../utils/neonColors";

interface PremiumFeatureListProps {
  showComparison?: boolean;
  highlightPremium?: boolean;
}

export const PremiumFeatureList: React.FC<PremiumFeatureListProps> = ({
  showComparison = true,
  highlightPremium = true
}) => {
  const userProfile = useTwinStore((state) => state.userProfile);
  const hasAccessTo = useSubscriptionStore((state) => state.hasAccessTo);
  const accentColor = userProfile?.accentColor || "neon-purple";
  const neonColor = getNeonAccentColor(accentColor);

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

  const groupedFeatures = PREMIUM_FEATURES.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, PremiumFeature[]>);

  const categoryTitles: Record<string, string> = {
    assessment: "Assessment & Analysis",
    coaching: "Personal Growth",
    analytics: "Progress Tracking", 
    export: "Report Generation",
    insights: "AI Intelligence"
  };

  return (
    <ScrollView 
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      {showComparison && (
        <View className="mb-6">
          <Text className="text-white text-2xl font-bold text-center mb-2">
            Free vs Premium
          </Text>
          <Text className="text-gray-400 text-center px-4">
            Unlock the full potential of your twin bond
          </Text>
        </View>
      )}

      {/* Free features */}
      <View className="mb-8">
        <View className="flex-row items-center mb-4">
          <View 
            className="w-3 h-3 rounded-full mr-3"
            style={{ backgroundColor: '#10b981' }}
          />
          <Text className="text-white text-lg font-semibold">
            Free Features
          </Text>
        </View>
        
        <View className="bg-gray-800/30 rounded-2xl p-4 border border-gray-700">
          {[
            "Basic assessment results",
            "Twin pairing & chat", 
            "Psychic games",
            "Story sharing",
            "Basic twintuition alerts"
          ].map((feature, index) => (
            <View key={index} className="flex-row items-center py-2">
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text className="text-gray-300 text-sm ml-3">{feature}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Premium features by category */}
      {Object.entries(groupedFeatures).map(([category, features]) => (
        <View key={category} className="mb-8">
          <View className="flex-row items-center mb-4">
            <View 
              className="w-3 h-3 rounded-full mr-3"
              style={{ backgroundColor: neonColor }}
            />
            <Text className="text-white text-lg font-semibold">
              {categoryTitles[category]} 
            </Text>
            <View 
              className="ml-2 px-2 py-1 rounded-full"
              style={{ backgroundColor: `${neonColor}20` }}
            >
              <Text 
                className="text-xs font-bold"
                style={{ color: neonColor }}
              >
                PREMIUM
              </Text>
            </View>
          </View>

          <LinearGradient
            colors={[
              `${neonColor}10`, 
              'rgba(0, 0, 0, 0.2)', 
              `${neonColor}05`
            ]}
            className="rounded-2xl p-4 border"
            style={{ borderColor: `${neonColor}40` }}
          >
            {features.map((feature, index) => {
              const userHasAccess = hasAccessTo(feature.id);
              
              return (
                <View key={feature.id} className="py-3">
                  <View className="flex-row items-center mb-2">
                    <View 
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: `${neonColor}20` }}
                    >
                      <Ionicons 
                        name={getFeatureIcon(feature.icon)} 
                        size={20} 
                        color={neonColor} 
                      />
                    </View>
                    
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-base">
                        {feature.name}
                      </Text>
                      <Text className="text-gray-400 text-sm mt-1">
                        {feature.description}
                      </Text>
                    </View>

                    <View className="ml-2">
                      {userHasAccess ? (
                        <View 
                          className="w-6 h-6 rounded-full items-center justify-center"
                          style={{ backgroundColor: neonColor }}
                        >
                          <Ionicons name="checkmark" size={14} color="black" />
                        </View>
                      ) : (
                        <View 
                          className="w-6 h-6 rounded-full items-center justify-center border-2"
                          style={{ borderColor: '#6b7280' }}
                        >
                          <Ionicons name="lock-closed" size={12} color="#6b7280" />
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Feature teaser */}
                  {feature.teaser && !userHasAccess && highlightPremium && (
                    <View 
                      className="mt-2 p-3 rounded-lg border-l-4"
                      style={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        borderLeftColor: neonColor 
                      }}
                    >
                      <Text 
                        className="text-sm font-semibold mb-1"
                        style={{ color: neonColor }}
                      >
                        {feature.teaser.title}
                      </Text>
                      <Text className="text-gray-400 text-xs">
                        {feature.teaser.content}
                      </Text>
                    </View>
                  )}

                  {index < features.length - 1 && (
                    <View className="mt-3 h-px bg-gray-700/50" />
                  )}
                </View>
              );
            })}
          </LinearGradient>
        </View>
      ))}

      {/* Bottom CTA */}
      <View className="mt-4 p-6 rounded-2xl border" style={{ borderColor: neonColor }}>
        <View className="items-center">
          <Ionicons name="star" size={32} color={neonColor} />
          <Text className="text-white text-xl font-bold text-center mt-2">
            Unlock Your Twin Potential
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            Get personalized insights, coaching plans, and detailed analytics to strengthen your twin bond
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};