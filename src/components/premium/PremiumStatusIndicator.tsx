import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTwinStore } from "../../state/twinStore";
import { useSubscriptionStore } from "../../state/subscriptionStore";
import { usePremiumFeatures } from "../../hooks/usePremiumFeatures";
import { getNeonAccentColor } from "../../utils/neonColors";

interface PremiumStatusIndicatorProps {
  variant?: "compact" | "full" | "minimal";
  showUpgradeButton?: boolean;
  onUpgradePress?: () => void;
}

export const PremiumStatusIndicator: React.FC<PremiumStatusIndicatorProps> = ({
  variant = "compact",
  showUpgradeButton = true,
  onUpgradePress
}) => {
  const userProfile = useTwinStore((state) => state.userProfile);
  const subscriptionInfo = useSubscriptionStore((state) => state.subscriptionInfo);
  const { navigateToUpgrade } = usePremiumFeatures();
  
  const accentColor = userProfile?.accentColor || "neon-purple";
  const neonColor = getNeonAccentColor(accentColor);

  const handleUpgradePress = () => {
    if (onUpgradePress) {
      onUpgradePress();
    } else {
      navigateToUpgrade(undefined, 'status_indicator');
    }
  };

  if (subscriptionInfo.isActive) {
    // Premium user indicator
    const renderPremiumStatus = () => {
      const expiryDate = subscriptionInfo.expiryDate ? new Date(subscriptionInfo.expiryDate) : null;
      const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
      
      switch (variant) {
        case "minimal":
          return (
            <View className="flex-row items-center">
              <Ionicons name="star" size={14} color={neonColor} />
              <Text style={{ color: neonColor }} className="text-xs font-bold ml-1">
                PREMIUM
              </Text>
            </View>
          );

        case "full":
          return (
            <LinearGradient
              colors={[`${neonColor}20`, `${neonColor}10`, 'transparent']}
              className="p-4 rounded-2xl border"
              style={{ borderColor: neonColor }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View 
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: `${neonColor}30` }}
                  >
                    <Ionicons name="star" size={20} color={neonColor} />
                  </View>
                  <View>
                    <Text className="text-white font-bold">Premium Active</Text>
                    <Text className="text-gray-400 text-sm">
                      {subscriptionInfo.plan === "yearly" ? "Annual" : "Monthly"} Plan
                    </Text>
                  </View>
                </View>
                
                {daysUntilExpiry && daysUntilExpiry < 7 && (
                  <View className="bg-yellow-500/20 px-2 py-1 rounded-full">
                    <Text className="text-yellow-400 text-xs font-bold">
                      {daysUntilExpiry}d left
                    </Text>
                  </View>
                )}
              </View>
              
              {expiryDate && (
                <Text className="text-gray-500 text-xs mt-2">
                  Renews {expiryDate.toLocaleDateString()}
                </Text>
              )}
            </LinearGradient>
          );

        case "compact":
        default:
          return (
            <View 
              className="px-3 py-2 rounded-full border flex-row items-center"
              style={{ 
                backgroundColor: `${neonColor}20`,
                borderColor: neonColor 
              }}
            >
              <Ionicons name="star" size={16} color={neonColor} />
              <Text 
                className="text-sm font-bold ml-2"
                style={{ color: neonColor }}
              >
                Premium
              </Text>
              {daysUntilExpiry && daysUntilExpiry < 7 && (
                <Text className="text-yellow-400 text-xs ml-2">
                  ({daysUntilExpiry}d)
                </Text>
              )}
            </View>
          );
      }
    };

    return renderPremiumStatus();
  }

  // Free user - show upgrade option
  const renderFreeStatus = () => {
    switch (variant) {
      case "minimal":
        return showUpgradeButton ? (
          <TouchableOpacity 
            onPress={handleUpgradePress}
            className="flex-row items-center"
          >
            <Ionicons name="star-outline" size={14} color="#6b7280" />
            <Text className="text-gray-400 text-xs font-bold ml-1">
              FREE
            </Text>
          </TouchableOpacity>
        ) : (
          <View className="flex-row items-center">
            <Ionicons name="star-outline" size={14} color="#6b7280" />
            <Text className="text-gray-400 text-xs font-bold ml-1">
              FREE
            </Text>
          </View>
        );

      case "full":
        return (
          <View className="p-4 rounded-2xl border border-gray-600 bg-gray-800/30">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-gray-600/30 items-center justify-center mr-3">
                  <Ionicons name="star-outline" size={20} color="#6b7280" />
                </View>
                <View>
                  <Text className="text-white font-bold">Free Plan</Text>
                  <Text className="text-gray-400 text-sm">
                    Basic features included
                  </Text>
                </View>
              </View>
              
              {showUpgradeButton && (
                <TouchableOpacity
                  onPress={handleUpgradePress}
                  style={{ backgroundColor: neonColor }}
                  className="px-4 py-2 rounded-full"
                >
                  <Text className="text-black font-bold text-sm">
                    Upgrade
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {showUpgradeButton && (
              <Text className="text-gray-500 text-xs mt-2">
                Unlock detailed insights and coaching plans
              </Text>
            )}
          </View>
        );

      case "compact":
      default:
        return showUpgradeButton ? (
          <TouchableOpacity 
            onPress={handleUpgradePress}
            className="px-3 py-2 rounded-full border border-gray-600 bg-gray-800/30 flex-row items-center"
          >
            <Ionicons name="star-outline" size={16} color="#6b7280" />
            <Text className="text-gray-400 text-sm font-bold ml-2">
              Free
            </Text>
            <Ionicons name="arrow-forward" size={14} color={neonColor} className="ml-2" />
          </TouchableOpacity>
        ) : (
          <View className="px-3 py-2 rounded-full border border-gray-600 bg-gray-800/30 flex-row items-center">
            <Ionicons name="star-outline" size={16} color="#6b7280" />
            <Text className="text-gray-400 text-sm font-bold ml-2">
              Free Plan
            </Text>
          </View>
        );
    }
  };

  return renderFreeStatus();
};