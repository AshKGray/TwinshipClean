import React, { memo, useCallback } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { ImageBackground } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTwinStore } from "../state/twinStore";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  getNeonAccentColor,
  getNeonCardBackground,
  getNeonButtonBackground,
  getNeonGlowEffect,
  getNeonSubtleGlow,
  getNeonContrastingTextColor,
  getNeonBorderColor
} from "../utils/neonColors";

// Memoized action button component for performance
const ActionButton = memo(({ 
  onPress, 
  icon, 
  bgColor, 
  title, 
  subtitle, 
  isPremium = false, 
  badgeCount = 0,
  accentColor 
}: {
  onPress: () => void;
  icon: string;
  bgColor: string;
  title: string;
  subtitle: string;
  isPremium?: boolean;
  badgeCount?: number;
  accentColor: string;
}) => {
  const glowEffect = getNeonSubtleGlow(accentColor as any);
  
  return (
    <Pressable 
      onPress={onPress} 
      style={[
        {
          backgroundColor: getNeonCardBackground(accentColor as any),
          borderColor: getNeonBorderColor(accentColor as any),
          borderWidth: 1,
        },
        glowEffect
      ]}
      className="rounded-xl p-4 flex-row items-center mb-4"
    >
      {isPremium && (
        <View className="absolute top-2 right-2 bg-yellow-500 rounded-full px-2 py-1 border border-yellow-400">
          <Text className="text-black text-xs font-bold">PREMIUM</Text>
        </View>
      )}
      
      <View 
        style={{ backgroundColor: bgColor }} 
        className="rounded-full p-3 mr-4"
      >
        <Ionicons name={icon as any} size={24} color="white" />
      </View>
      
      <View className="flex-1">
        <Text className="text-white text-lg font-bold">{title}</Text>
        <Text className="text-white/80 text-sm font-medium">{subtitle}</Text>
      </View>
      
      {badgeCount > 0 && (
        <View 
          style={{ backgroundColor: getNeonAccentColor(accentColor as any) }}
          className="rounded-full w-6 h-6 items-center justify-center mr-2"
        >
          <Text className="text-white text-xs font-bold">{badgeCount}</Text>
        </View>
      )}
      
      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
    </Pressable>
  );
});

export const HomeScreen = memo(() => {
  const { themeColor, userProfile, twinProfile, twintuitionAlerts } = useTwinStore();
  const navigation = useNavigation<any>();
  
  const unreadAlerts = twintuitionAlerts.filter(alert => !alert.isRead).length;
  const accentColor = themeColor || 'neon-purple';
  const neonColor = getNeonAccentColor(accentColor);
  const cardBg = getNeonCardBackground(accentColor);
  const buttonBg = getNeonButtonBackground(accentColor);
  const headerGlow = getNeonGlowEffect(accentColor);
  
  // Memoized navigation handlers for performance
  const handleNavigateToPair = useCallback(() => navigation.navigate("Twinvitation"), [navigation]);
  const handleNavigateToChat = useCallback(() => navigation.navigate("TwinTalk"), [navigation]);
  const handleNavigateToTwintuition = useCallback(() => navigation.navigate("Twintuition"), [navigation]);
  const handleNavigateToAssessment = useCallback(() => navigation.navigate("AssessmentIntro"), [navigation]);
  const handleNavigateToGames = useCallback(() => navigation.navigate("Twingames"), [navigation]);
  const handleNavigateToResearch = useCallback(() => navigation.navigate("Twinquiry"), [navigation]);

  return (
    <ImageBackground
      source={require("../../assets/galaxybackground.png")}
      style={{ flex: 1 }}
      contentFit="cover"
      placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
      transition={200}
    >
      <SafeAreaView className="flex-1">
        <ScrollView 
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
        >
          {/* Header with Neon Glow */}
          <View className="pt-4 pb-8">
            <Text 
              style={[
                { color: neonColor, textShadowColor: neonColor, textShadowRadius: 10 },
                headerGlow
              ]}
              className="text-3xl font-bold text-center mb-2"
            >
              Twinship
            </Text>
            <Text className="text-white/70 text-center mt-2 font-medium">
              Twinfinity...and beyond!
            </Text>
          </View>

          {/* Twin Connection Status */}
          <View 
            style={[
              { backgroundColor: cardBg, borderColor: neonColor, borderWidth: 1 },
              getNeonSubtleGlow(accentColor)
            ]}
            className="rounded-2xl p-6 mb-6"
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-xl font-bold">Twin Connection</Text>
              <Pressable 
                onPress={handleNavigateToPair}
                style={[
                  { backgroundColor: buttonBg, borderColor: neonColor, borderWidth: 1 },
                  getNeonSubtleGlow(accentColor)
                ]}
                className="rounded-full px-4 py-2"
              >
                <Text className="text-white font-bold">Pair</Text>
              </Pressable>
            </View>
            
            <View className="flex-row items-center space-x-4">
              <View 
                style={[
                  { backgroundColor: buttonBg, borderColor: neonColor, borderWidth: 2 },
                  getNeonSubtleGlow(accentColor)
                ]}
                className="rounded-full w-16 h-16 items-center justify-center"
              >
                <Text className="text-white text-xl font-bold">
                  {userProfile?.name?.charAt(0) || "U"}
                </Text>
              </View>
              
              <View className="flex-1 items-center">
                <Ionicons name="heart" size={24} color={neonColor} />
                <Text className="text-white/90 text-xs mt-1 font-medium">Connected</Text>
              </View>
              
              <View 
                style={[
                  { backgroundColor: buttonBg, borderColor: neonColor, borderWidth: 2 },
                  getNeonSubtleGlow(accentColor)
                ]}
                className="rounded-full w-16 h-16 items-center justify-center"
              >
                <Text className="text-white text-xl font-bold">
                  {twinProfile?.name?.charAt(0) || "T"}
                </Text>
              </View>
            </View>
            
            <Text className="text-white/90 text-center mt-4 font-medium">
              {userProfile?.name} & {twinProfile?.name}
            </Text>
          </View>

          {/* Quick Actions */}
          <View className="space-y-0">
            <ActionButton
              onPress={handleNavigateToChat}
              icon="chatbubbles"
              bgColor={buttonBg}
              title="Private Chat"
              subtitle="Connect instantly with your twin"
              accentColor={accentColor}
            />
            
            <ActionButton
              onPress={handleNavigateToTwintuition}
              icon="flash"
              bgColor={buttonBg}
              title="Twintuition Alerts"
              subtitle={unreadAlerts > 0 ? `${unreadAlerts} new alerts` : "No new alerts"}
              badgeCount={unreadAlerts}
              accentColor={accentColor}
            />
            
            <ActionButton
              onPress={handleNavigateToAssessment}
              icon="analytics"
              bgColor={buttonBg}
              title="Personality Assessment"
              subtitle="Deep insights into your twin personality dynamics"
              isPremium={true}
              accentColor={accentColor}
            />
            
            <ActionButton
              onPress={handleNavigateToGames}
              icon="game-controller"
              bgColor={buttonBg}
              title="Twin Games"
              subtitle="Test your twin synchronicity"
              accentColor={accentColor}
            />
            
            <ActionButton
              onPress={handleNavigateToTwintuition}
              icon="library"
              bgColor={buttonBg}
              title="Twincidence Log"
              subtitle="Track your twin moments & stories"
              accentColor={accentColor}
            />
            
            <ActionButton
              onPress={handleNavigateToResearch}
              icon="flask"
              bgColor={buttonBg}
              title="Research Studies"
              subtitle="Contribute to twin science"
              accentColor={accentColor}
            />
          </View>

          {/* Recent Activity */}
          <View className="mt-8 mb-6">
            <Text className="text-white text-xl font-bold mb-4">Recent Activity</Text>
            <View 
              style={{ backgroundColor: cardBg }}
              className="rounded-xl p-6 items-center"
            >
              <Ionicons name="time-outline" size={48} color={neonColor} opacity={0.7} />
              <Text className="text-white/80 text-center mt-4 font-medium">
                No recent activity yet. Start connecting with your twin!
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
});