import React, { useState } from "react";
import { View, Text, Pressable, Alert, ScrollView, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// Premium imports
import { PremiumStatusIndicator } from "../components/premium/PremiumStatusIndicator";
import { PremiumUpgradeButton } from "../components/premium/PremiumBadge";
import { PremiumOnly } from "../components/premium/PremiumGatedContent";
import { usePremiumFeatures } from "../hooks/usePremiumFeatures";
import { subscriptionService } from "../services/subscriptionService";

// Existing imports
import { useTwinStore } from "../state/twinStore";
import { useSubscriptionStore } from "../state/subscriptionStore";
import { getNeonAccentColor } from "../utils/neonColors";

export const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { 
    userProfile, 
    twinProfile, 
    signOut, 
    researchParticipation, 
    setResearchParticipation, 
    notificationsEnabled, 
    setNotificationsEnabled 
  } = useTwinStore();
  
  const {
    subscriptionInfo,
    isRestoring,
    mockRestore
  } = useSubscriptionStore();
  
  const {
    isSubscriptionActive,
    navigateToUpgrade
  } = usePremiumFeatures();
  
  const [isRestoringPurchases, setIsRestoringPurchases] = useState(false);
  
  const themeColor = userProfile?.accentColor || "neon-purple";
  const neonColor = getNeonAccentColor(themeColor);

  const handleSignOut = () => {
    Alert.alert(
      "Twinconnect",
      "Are you sure you want to twinconnect? You'll need to complete the setup process again to re-establish twinsync.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Twinconnect", 
          style: "destructive", 
          onPress: () => {
            signOut();
            Alert.alert("Twinconnected", "You have been successfully twinconnected.");
          }
        }
      ]
    );
  };

  const handleRestorePurchases = async () => {
    try {
      setIsRestoringPurchases(true);
      await mockRestore();
      
      if (subscriptionInfo.isActive) {
        Alert.alert(
          "Purchases Restored!",
          "Your premium subscription has been restored successfully."
        );
      } else {
        Alert.alert(
          "No Purchases Found",
          "We couldn't find any previous purchases to restore."
        );
      }
    } catch (error: any) {
      Alert.alert("Restore Failed", error.message || "Please try again later");
    } finally {
      setIsRestoringPurchases(false);
    }
  };

  const handleManageSubscription = () => {
    if (isSubscriptionActive) {
      Alert.alert(
        "Manage Subscription",
        "To manage your subscription, go to your device's App Store settings.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Open Settings", 
            onPress: () => {
              // In a real app, this would open the device's subscription settings
              Alert.alert("Info", "This would open your device's subscription management settings.");
            }
          }
        ]
      );
    } else {
      navigateToUpgrade(undefined, 'settings_manage');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatSubscriptionDate = (dateString?: string) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
  };

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6">
          {/* Header */}
          <View className="py-4">
            <Text className="text-white text-2xl font-bold text-center">
              Twinsettings
            </Text>
            <Text className="text-white/70 text-center mt-2">
              Manage your twincredible account and preferences
            </Text>
          </View>

          {/* Premium Status Section */}
          <View className="mb-6">
            <PremiumStatusIndicator
              variant="full"
              showUpgradeButton={!isSubscriptionActive}
              onUpgradePress={() => navigateToUpgrade(undefined, 'settings_status')}
            />
          </View>

          {/* Subscription Management - Only show if premium */}
          <PremiumOnly featureId="detailed_results">
            <View className="bg-white/10 rounded-xl p-6 mb-6">
              <Text className="text-white text-lg font-semibold mb-4">Subscription</Text>
              
              <View className="space-y-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-white">Plan</Text>
                  <Text className="text-white font-medium capitalize">
                    {subscriptionInfo.plan} Plan
                  </Text>
                </View>
                
                <View className="flex-row items-center justify-between">
                  <Text className="text-white">Status</Text>
                  <View className="flex-row items-center">
                    <View 
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: subscriptionInfo.isActive ? '#10b981' : '#ef4444' }}
                    />
                    <Text 
                      className="font-medium"
                      style={{ color: subscriptionInfo.isActive ? '#10b981' : '#ef4444' }}
                    >
                      {subscriptionInfo.status}
                    </Text>
                  </View>
                </View>
                
                {subscriptionInfo.expiryDate && (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white">
                      {subscriptionInfo.willRenew ? 'Renews' : 'Expires'}
                    </Text>
                    <Text className="text-white/70">
                      {formatSubscriptionDate(subscriptionInfo.expiryDate)}
                    </Text>
                  </View>
                )}
                
                <View className="pt-3 border-t border-white/10">
                  <Pressable
                    onPress={handleManageSubscription}
                    className="flex-row items-center justify-between"
                  >
                    <Text className="text-white">Manage Subscription</Text>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                  </Pressable>
                </View>
              </View>
            </View>
          </PremiumOnly>

          {/* User Profile Section */}
          {userProfile && (
            <View className="bg-white/10 rounded-xl p-6 mb-6">
              <Text className="text-white text-lg font-semibold mb-4">Your Twinprofile</Text>
              
              <View className="space-y-3">
                <View className="flex-row items-center">
                  <Ionicons name="person" size={20} color="white" />
                  <Text className="text-white ml-3">{userProfile.name}</Text>
                </View>
                
                <View className="flex-row items-center">
                  <Ionicons name="calendar" size={20} color="white" />
                  <Text className="text-white ml-3">Age: {userProfile.age}</Text>
                </View>
                
                <View className="flex-row items-center">
                  <Ionicons name="transgender" size={20} color="white" />
                  <Text className="text-white ml-3">Gender: {userProfile.gender}</Text>
                </View>
                
                <View className="flex-row items-center">
                  <Ionicons name="people" size={20} color="white" />
                  <Text className="text-white ml-3 capitalize">{userProfile.twinType} Twin</Text>
                </View>
                
                <View className="flex-row items-center">
                  <Ionicons name="gift" size={20} color="white" />
                  <Text className="text-white ml-3">Birthday: {formatDate(userProfile.birthDate)}</Text>
                </View>
                
                <View className="flex-row items-center">
                  <View 
                    className="w-5 h-5 rounded-full mr-3"
                    style={{ backgroundColor: getNeonAccentColor(userProfile.accentColor) }}
                  />
                  <Text className="text-white">Your Accent Color</Text>
                </View>
              </View>
            </View>
          )}

          {/* Twin Connection Section */}
          {twinProfile && (
            <View className="bg-white/10 rounded-xl p-6 mb-6">
              <Text className="text-white text-lg font-semibold mb-4">Twinconnection Status</Text>
              
              <View className="space-y-3">
                <View className="flex-row items-center">
                  <Ionicons name="heart" size={20} color="white" />
                  <Text className="text-white ml-3">{twinProfile.name}</Text>
                </View>
                
                <View className="flex-row items-center">
                  <View 
                    className="w-5 h-5 rounded-full mr-3"
                    style={{ backgroundColor: getNeonAccentColor(twinProfile.accentColor) }}
                  />
                  <Text className="text-white">Twin's Accent Color</Text>
                </View>
                
                <View className="flex-row items-center">
                  <View className={`w-3 h-3 rounded-full mr-3 ${twinProfile.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <Text className="text-white">{twinProfile.isConnected ? 'Twinsync Active' : 'Twinconnection Lost'}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Premium Features Access - Quick Links */}
          <View className="bg-white/10 rounded-xl p-6 mb-6">
            <Text className="text-white text-lg font-semibold mb-4">Premium Features</Text>
            
            <View className="space-y-4">
              <Pressable 
                onPress={() => navigation.navigate('Premium', { source: 'settings' })}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <Ionicons name="star" size={20} color={neonColor} />
                  <Text className="text-white ml-3">
                    {isSubscriptionActive ? 'Premium Dashboard' : 'Upgrade to Premium'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </Pressable>
              
              <Pressable 
                onPress={() => navigation.navigate('PremiumFeatures')}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <Ionicons name="list" size={20} color="white" />
                  <Text className="text-white ml-3">View All Features</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </Pressable>
              
              <Pressable 
                onPress={handleRestorePurchases}
                disabled={isRestoringPurchases}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <Ionicons 
                    name="refresh" 
                    size={20} 
                    color={isRestoringPurchases ? "#6b7280" : "white"} 
                  />
                  <Text className={`ml-3 ${isRestoringPurchases ? 'text-gray-400' : 'text-white'}`}>
                    {isRestoringPurchases ? 'Restoring...' : 'Restore Purchases'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
          </View>

          {/* App Settings */}
          <View className="bg-white/10 rounded-xl p-6 mb-6">
            <Text className="text-white text-lg font-semibold mb-4">Twincredible Settings</Text>
            
            <View className="space-y-4">
              <Pressable
                onPress={() => setNotificationsEnabled(!notificationsEnabled)}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <Ionicons name="notifications" size={20} color="white" />
                  <Text className="text-white ml-3">Twinspirations</Text>
                </View>
                <Ionicons 
                  name={notificationsEnabled ? "toggle" : "toggle-outline"} 
                  size={24} 
                  color={notificationsEnabled ? neonColor : "rgba(255,255,255,0.5)"} 
                />
              </Pressable>
              
              <Pressable
                onPress={() => setResearchParticipation(!researchParticipation)}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <Ionicons name="flask" size={20} color="white" />
                  <Text className="text-white ml-3">Twinquiry Participation</Text>
                </View>
                <Ionicons 
                  name={researchParticipation ? "toggle" : "toggle-outline"} 
                  size={24} 
                  color={researchParticipation ? neonColor : "rgba(255,255,255,0.5)"} 
                />
              </Pressable>
            </View>
          </View>

          {/* Account Actions */}
          <View className="bg-white/10 rounded-xl p-6 mb-6">
            <Text className="text-white text-lg font-semibold mb-4">Twincredible Account</Text>
            
            <View className="space-y-4">
              <Pressable className="flex-row items-center">
                <Ionicons name="create" size={20} color="white" />
                <Text className="text-white ml-3">Edit Twinprofile</Text>
                <View className="flex-1" />
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </Pressable>
              
              <Pressable className="flex-row items-center">
                <Ionicons name="help-circle" size={20} color="white" />
                <Text className="text-white ml-3">Twincredible Support</Text>
                <View className="flex-1" />
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </Pressable>
              
              <Pressable className="flex-row items-center">
                <Ionicons name="document-text" size={20} color="white" />
                <Text className="text-white ml-3">Twincredible Privacy</Text>
                <View className="flex-1" />
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </Pressable>
              
              <Pressable className="flex-row items-center">
                <Ionicons name="information-circle" size={20} color="white" />
                <Text className="text-white ml-3">About Twinship</Text>
                <View className="flex-1" />
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
          </View>

          {/* Upgrade CTA for Free Users */}
          {!isSubscriptionActive && (
            <View className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-6 mb-6 border border-purple-500/30">
              <View className="items-center">
                <Ionicons name="star" size={32} color={neonColor} />
                <Text className="text-white text-xl font-bold text-center mt-2">
                  Unlock Premium Features
                </Text>
                <Text className="text-gray-300 text-center mt-2 mb-4">
                  Get detailed insights, coaching plans, and unlimited assessments
                </Text>
                <PremiumUpgradeButton
                  featureId="detailed_results"
                  onUpgrade={() => navigateToUpgrade(undefined, 'settings_cta')}
                  text="Upgrade Now"
                />
              </View>
            </View>
          )}

          {/* Sign Out Button */}
          <View className="bg-white/10 rounded-xl p-6 mb-8">
            <Pressable
              onPress={handleSignOut}
              className="flex-row items-center justify-center py-2"
            >
              <Ionicons name="log-out" size={20} color="#ff4444" />
              <Text className="text-red-400 ml-3 text-lg font-semibold">Twinconnect</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};