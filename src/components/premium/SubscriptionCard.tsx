import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SubscriptionProduct } from "../../types/premium/subscription";
import { useTwinStore } from "../../state/twinStore";
import { getNeonAccentColor, getNeonGradientColors } from "../../utils/neonColors";

interface SubscriptionCardProps {
  product: SubscriptionProduct;
  isSelected?: boolean;
  isPopular?: boolean;
  onSelect: (product: SubscriptionProduct) => void;
  loading?: boolean;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  product,
  isSelected = false,
  isPopular = false,
  onSelect,
  loading = false
}) => {
  const userProfile = useTwinStore((state) => state.userProfile);
  const accentColor = userProfile?.accentColor || "neon-purple";
  const neonColor = getNeonAccentColor(accentColor);
  const [gradientStart, gradientMid, gradientEnd] = getNeonGradientColors(accentColor);

  const getSavingsPercentage = () => {
    if (product.subscriptionPeriod === "yearly" || product.period === "year") {
      // Handle both mock and RevenueCat data structures
      const yearlyPrice = product.priceAmountMicros ? 
        (product.priceAmountMicros / 1000000) : 
        (product.priceAmount || 59.99);
      const monthlyEquivalent = yearlyPrice / 12;
      const monthlyPrice = 9.99; // Monthly product price
      const savings = ((monthlyPrice - monthlyEquivalent) / monthlyPrice) * 100;
      return Math.round(savings);
    }
    return 0;
  };

  const savingsPercentage = getSavingsPercentage();

  return (
    <TouchableOpacity
      onPress={() => onSelect(product)}
      disabled={loading}
      className="mb-4"
      style={{ opacity: loading ? 0.7 : 1 }}
    >
      <View className="relative">
        {/* Popular badge */}
        {isPopular && (
          <View 
            className="absolute -top-3 left-4 z-10 px-3 py-1 rounded-full"
            style={{ backgroundColor: neonColor }}
          >
            <Text className="text-black text-xs font-bold">MOST POPULAR</Text>
          </View>
        )}

        {/* Savings badge */}
        {savingsPercentage > 0 && (
          <View 
            className="absolute -top-3 right-4 z-10 px-3 py-1 rounded-full border-2"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.8)', 
              borderColor: neonColor 
            }}
          >
            <Text style={{ color: neonColor }} className="text-xs font-bold">
              SAVE {savingsPercentage}%
            </Text>
          </View>
        )}

        <LinearGradient
          colors={
            isSelected 
              ? [gradientStart, gradientMid, gradientEnd]
              : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.05)']
          }
          className="rounded-2xl p-6 border-2"
          style={{
            borderColor: isSelected ? neonColor : 'rgba(255, 255, 255, 0.2)',
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-white text-xl font-bold mb-1">
                {product.title}
              </Text>
              <Text className="text-gray-300 text-sm">
                {product.description}
              </Text>
            </View>
            
            {loading ? (
              <ActivityIndicator color={neonColor} size="small" />
            ) : (
              <View 
                className="w-6 h-6 rounded-full border-2 items-center justify-center"
                style={{ borderColor: neonColor }}
              >
                {isSelected && (
                  <View 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: neonColor }}
                  />
                )}
              </View>
            )}
          </View>

          <View className="flex-row items-baseline justify-between">
            <View className="flex-row items-baseline">
              <Text className="text-white text-3xl font-bold">
                {product.price}
              </Text>
              <Text className="text-gray-400 text-sm ml-1">
                /{(product.subscriptionPeriod === "yearly" || product.period === "year") ? "year" : "month"}
              </Text>
            </View>

            {(product.subscriptionPeriod === "yearly" || product.period === "year") && (
              <Text className="text-gray-400 text-sm">
                ${product.priceAmountMicros ? 
                  (((product.priceAmountMicros / 1000000) / 12).toFixed(2)) :
                  (((product.priceAmount || 59.99) / 12).toFixed(2))
                }/month
              </Text>
            )}
          </View>

          {/* Introductory offer */}
          {product.introductoryPrice && (
            <View className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
              <View className="flex-row items-center">
                <Ionicons name="gift-outline" size={16} color={neonColor} />
                <Text className="text-white text-sm font-semibold ml-2">
                  Special Offer: {product.introductoryPrice.price} for first 3 months
                </Text>
              </View>
            </View>
          )}

          {/* Features preview for yearly */}
          {(product.subscriptionPeriod === "yearly" || product.period === "year") && (
            <View className="mt-4 space-y-2">
              {[
                "Detailed assessment results",
                "Personalized coaching plans", 
                "PDF report exports",
                "Advanced twin analytics",
                "AI-powered recommendations"
              ].map((feature, index) => (
                <View key={index} className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={16} color={neonColor} />
                  <Text className="text-gray-300 text-sm ml-2">{feature}</Text>
                </View>
              ))}
            </View>
          )}
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};