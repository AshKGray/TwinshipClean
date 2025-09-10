import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Alert, ImageBackground, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { SubscriptionCard } from "../../components/premium/SubscriptionCard";
import { PremiumFeatureList } from "../../components/premium/PremiumFeatureList";
import { PremiumStatusIndicator } from "../../components/premium/PremiumStatusIndicator";

import { usePremiumFeatures } from "../../hooks/usePremiumFeatures";
import { useSubscriptionStore } from "../../state/subscriptionStore";
import { useTwinStore } from "../../state/twinStore";
import { subscriptionService } from "../../services/subscriptionService";
import { SubscriptionProduct } from "../../types/premium/subscription";
import { getNeonAccentColor, getNeonGradientColors } from "../../utils/neonColors";

interface PremiumScreenProps {
  route?: {
    params?: {
      feature?: string;
      source?: string;
    };
  };
}

export const PremiumScreen: React.FC<PremiumScreenProps> = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { feature, source } = (route.params as any) || {};
  
  const { userProfile } = useTwinStore();
  const {
    subscriptionInfo,
    isPurchasing,
    isRestoring,
    purchaseProduct,
    restorePurchases,
    trackConversionEvent
  } = useSubscriptionStore();
  
  const { isSubscriptionActive } = usePremiumFeatures();
  
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  
  const themeColor = userProfile?.accentColor || "neon-purple";
  const neonColor = getNeonAccentColor(themeColor);
  const [gradientStart, gradientMid, gradientEnd] = getNeonGradientColors(themeColor);

  useEffect(() => {
    loadProducts();
    
    // Track screen view
    trackConversionEvent("premium_screen_viewed", { feature, source });
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const availableProducts = await subscriptionService.getProducts();
      setProducts(availableProducts);
      
      // Pre-select yearly plan if available
      const yearlyProduct = availableProducts.find(p => 
        p.id.includes("yearly") || p.period === "year"
      );
      if (yearlyProduct) {
        setSelectedProductId(yearlyProduct.id);
      } else if (availableProducts.length > 0) {
        setSelectedProductId(availableProducts[0].id);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
      Alert.alert("Error", "Failed to load subscription options. Please try again.");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedProductId) {
      Alert.alert("Selection Required", "Please select a subscription plan.");
      return;
    }

    try {
      trackConversionEvent("purchase_attempted", { 
        productId: selectedProductId, 
        feature, 
        source 
      });

      const result = await purchaseProduct(selectedProductId);
      
      if (result.success) {
        Alert.alert(
          "Welcome to Premium!",
          "Your subscription is now active. Enjoy unlimited access to all premium features!",
          [
            {
              text: "Explore Features",
              onPress: () => {
                trackConversionEvent("purchase_success_explore", { productId: selectedProductId });
                navigation.navigate("PremiumDashboard");
              }
            }
          ]
        );
      } else if (result.userCancelled) {
        trackConversionEvent("purchase_cancelled", { productId: selectedProductId });
      } else {
        Alert.alert(
          "Purchase Failed",
          result.error || "Unable to complete purchase. Please try again."
        );
        trackConversionEvent("purchase_failed", { 
          productId: selectedProductId, 
          error: result.error 
        });
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      Alert.alert("Purchase Error", "An unexpected error occurred. Please try again.");
      trackConversionEvent("purchase_error", { 
        productId: selectedProductId, 
        error: error.message 
      });
    }
  };

  const handleRestore = async () => {
    try {
      trackConversionEvent("restore_attempted", { source });
      await restorePurchases();
      
      if (subscriptionInfo.isActive) {
        Alert.alert(
          "Purchases Restored!",
          "Your premium subscription has been restored successfully.",
          [
            {
              text: "Continue",
              onPress: () => navigation.navigate("PremiumDashboard")
            }
          ]
        );
      } else {
        Alert.alert(
          "No Purchases Found",
          "We couldn't find any previous purchases to restore. If you believe this is an error, please contact support."
        );
      }
    } catch (error: any) {
      Alert.alert("Restore Failed", error.message || "Please try again later");
    }
  };

  const handleSelectProduct = (product: SubscriptionProduct) => {
    setSelectedProductId(product.id);
    trackConversionEvent("product_selected", { 
      productId: product.id, 
      period: product.period || product.subscriptionPeriod 
    });
  };

  if (isSubscriptionActive) {
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          <ScrollView className="flex-1 px-6">
            {/* Header */}
            <View className="flex-row items-center justify-between pt-4 pb-6">
              <Pressable onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </Pressable>
              <Text className="text-white text-xl font-semibold">Premium</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Already Premium Message */}
            <View className="items-center py-12">
              <LinearGradient
                colors={[gradientStart, gradientMid, gradientEnd]}
                className="w-24 h-24 rounded-full items-center justify-center mb-6"
              >
                <Ionicons name="star" size={48} color="black" />
              </LinearGradient>
              
              <Text className="text-white text-2xl font-bold text-center mb-2">
                You're Premium!
              </Text>
              <Text className="text-gray-300 text-center mb-8 max-w-sm">
                Enjoy unlimited access to all premium features and insights for your twin journey.
              </Text>
              
              <Pressable
                onPress={() => navigation.navigate("PremiumDashboard")}
                style={{ backgroundColor: neonColor }}
                className="px-8 py-4 rounded-2xl"
              >
                <Text className="text-black font-bold text-lg">View Dashboard</Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6">
          {/* Header */}
          <View className="flex-row items-center justify-between pt-4 pb-6">
            <Pressable onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <Text className="text-white text-xl font-semibold">Upgrade to Premium</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Hero Section */}
          <View className="items-center py-8">
            <LinearGradient
              colors={[gradientStart, gradientMid, gradientEnd]}
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
            >
              <Ionicons name="star" size={40} color="black" />
            </LinearGradient>
            
            <Text className="text-white text-3xl font-bold text-center mb-2">
              Unlock Your Twin Potential
            </Text>
            <Text className="text-gray-300 text-center mb-6 max-w-sm">
              Get detailed insights, personalized coaching, and advanced analytics to strengthen your twin bond.
            </Text>
          </View>

          {/* Premium Features List */}
          <PremiumFeatureList compact={true} />

          {/* Subscription Options */}
          <View className="mt-8">
            <Text className="text-white text-xl font-bold text-center mb-6">
              Choose Your Plan
            </Text>
            
            {isLoadingProducts ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color={neonColor} />
                <Text className="text-white mt-4">Loading subscription options...</Text>
              </View>
            ) : (
              <View className="space-y-4">
                {products.map((product) => (
                  <SubscriptionCard
                    key={product.id}
                    product={product}
                    isSelected={selectedProductId === product.id}
                    isPopular={product.id.includes("yearly") || product.period === "year"}
                    onSelect={handleSelectProduct}
                    loading={isPurchasing && selectedProductId === product.id}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Purchase Actions */}
          <View className="mt-8 mb-8">
            <Pressable
              onPress={handlePurchase}
              disabled={isPurchasing || !selectedProductId || isLoadingProducts}
              style={{ 
                backgroundColor: isPurchasing || !selectedProductId ? "#6b7280" : neonColor 
              }}
              className="rounded-2xl p-4 mb-4"
            >
              <View className="flex-row items-center justify-center">
                {isPurchasing ? (
                  <>
                    <ActivityIndicator color="black" size="small" />
                    <Text className="text-black font-bold text-lg ml-2">Processing...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="star" size={20} color="black" />
                    <Text className="text-black font-bold text-lg ml-2">
                      Start Premium Subscription
                    </Text>
                  </>
                )}
              </View>
            </Pressable>

            <Pressable
              onPress={handleRestore}
              disabled={isRestoring}
              className="flex-row items-center justify-center py-3"
            >
              {isRestoring ? (
                <>
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white ml-2">Restoring...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="refresh" size={16} color="white" />
                  <Text className="text-white ml-2">Restore Purchases</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Terms and Privacy */}
          <View className="items-center pb-8">
            <Text className="text-gray-400 text-xs text-center max-w-sm">
              Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period.
            </Text>
            <View className="flex-row mt-4 space-x-4">
              <Pressable>
                <Text className="text-gray-400 text-xs underline">Terms of Service</Text>
              </Pressable>
              <Pressable>
                <Text className="text-gray-400 text-xs underline">Privacy Policy</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};