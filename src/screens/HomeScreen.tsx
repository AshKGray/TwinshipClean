import React from "react";
import { View, Text, Pressable, ScrollView, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTwinStore } from "../state/twinStore";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export const HomeScreen = () => {
  const { themeColor, userProfile, twinProfile, twintuitionAlerts } = useTwinStore();
  const navigation = useNavigation<any>();
  
  const unreadAlerts = twintuitionAlerts.filter(alert => !alert.isRead).length;

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6">
          {/* Header */}
          <View className="pt-4 pb-8">
            <Text className="text-white text-3xl font-bold text-center">
              Twinship
            </Text>
            <Text className="text-white/70 text-center mt-2">
              Twinfinity...and beyond!
            </Text>
          </View>

          {/* Twin Connection Status */}
          <View className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-xl font-semibold">Twin Connection</Text>
              <Pressable onPress={() => navigation.navigate("Twinvitation")} className="bg-white/20 rounded-full px-3 py-1">
                <Text className="text-white">Pair</Text>
              </Pressable>
            </View>
            
            <View className="flex-row items-center space-x-4">
              <View className="bg-white/20 rounded-full w-16 h-16 items-center justify-center">
                <Text className="text-white text-xl font-bold">
                  {userProfile?.name?.charAt(0) || "U"}
                </Text>
              </View>
              
              <View className="flex-1 items-center">
                <Ionicons name="heart" size={24} color="white" />
                <Text className="text-white/70 text-xs mt-1">Connected</Text>
              </View>
              
              <View className="bg-white/20 rounded-full w-16 h-16 items-center justify-center">
                <Text className="text-white text-xl font-bold">
                  {twinProfile?.name?.charAt(0) || "T"}
                </Text>
              </View>
            </View>
            
            <Text className="text-white/70 text-center mt-4">
              {userProfile?.name} & {twinProfile?.name}
            </Text>
          </View>

          {/* Quick Actions */}
          <View className="space-y-4">
            <Pressable onPress={() => navigation.navigate("TwinTalk")} className="bg-white/10 rounded-xl p-4 flex-row items-center">
              <View className="bg-blue-500/30 rounded-full p-3 mr-4">
                <Ionicons name="chatbubbles" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold">Private Chat</Text>
                <Text className="text-white/70 text-sm">Connect instantly with your twin</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>

            <Pressable onPress={() => navigation.navigate("Twintuition")} className="bg-white/10 rounded-xl p-4 flex-row items-center">
              <View className="bg-purple-500/30 rounded-full p-3 mr-4">
                <Ionicons name="flash" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold">Twintuition Alerts</Text>
                <Text className="text-white/70 text-sm">
                  {unreadAlerts > 0 ? `${unreadAlerts} new alerts` : "No new alerts"}
                </Text>
              </View>
              {unreadAlerts > 0 && (
                <View className="bg-red-500 rounded-full w-6 h-6 items-center justify-center mr-2">
                  <Text className="text-white text-xs font-bold">{unreadAlerts}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>

            <Pressable onPress={() => navigation.navigate("AssessmentIntro")} className="bg-white/10 rounded-xl p-4 flex-row items-center relative overflow-hidden">
              {/* Premium Badge */}
              <View className="absolute top-2 right-2 bg-yellow-500 rounded-full px-2 py-1 border border-yellow-400">
                <Text className="text-black text-xs font-bold">PREMIUM</Text>
              </View>
              <View className="bg-pink-500/30 rounded-full p-3 mr-4">
                <Ionicons name="analytics" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold">Personality Assessment</Text>
                <Text className="text-white/70 text-sm">Deep insights into your twin personality dynamics</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>

            <Pressable onPress={() => navigation.navigate("Twingames")} className="bg-white/10 rounded-xl p-4 flex-row items-center">
              <View className="bg-green-500/30 rounded-full p-3 mr-4">
                <Ionicons name="game-controller" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold">Psychic Games</Text>
                <Text className="text-white/70 text-sm">Test your twin synchronicity</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>

             <Pressable onPress={() => navigation.navigate("Stories")} className="bg-white/10 rounded-xl p-4 flex-row items-center">
              <View className="bg-orange-500/30 rounded-full p-3 mr-4">
                <Ionicons name="book" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold">Twin Stories</Text>
                <Text className="text-white/70 text-sm">Share your journey together</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>

            <Pressable onPress={() => navigation.navigate("Twinquiry")} className="bg-white/10 rounded-xl p-4 flex-row items-center">
              <View className="bg-cyan-500/30 rounded-full p-3 mr-4">
                <Ionicons name="flask" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold">Research Studies</Text>
                <Text className="text-white/70 text-sm">Contribute to twin science</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>

          {/* Recent Activity */}
          <View className="mt-8 mb-6">
            <Text className="text-white text-xl font-semibold mb-4">Recent Activity</Text>
            <View className="bg-white/5 backdrop-blur-sm rounded-xl p-6 items-center">
              <Ionicons name="time-outline" size={48} color="rgba(255,255,255,0.5)" />
              <Text className="text-white/70 text-center mt-4">
                No recent activity yet. Start connecting with your twin!
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};