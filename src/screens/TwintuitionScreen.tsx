import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTwinStore } from "../state/twinStore";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";

export const TwintuitionScreen = () => {
  const navigation = useNavigation<any>();
  const { themeColor, twintuitionAlerts, addTwintuitionAlert, markAlertAsRead, twinProfile } = useTwinStore();
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [selectedType, setSelectedType] = useState<"feeling" | "thought" | "action">("feeling");

  const handleCreateAlert = async () => {
    if (!alertMessage.trim()) return;

    addTwintuitionAlert({
      message: alertMessage.trim(),
      type: selectedType,
      isRead: false,
    });

    // Haptics feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Schedule a local notification to simulate your twin receiving/responding
    try {
      await Notifications.requestPermissionsAsync();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Twintuition sent",
          body: `Shared with ${twinProfile?.name || "your twin"}`,
        },
        trigger: null,
      });
    } catch (e) {}

    setAlertMessage("");
    setShowCreateAlert(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "feeling": return "heart";
      case "thought": return "bulb";
      case "action": return "flash";
      default: return "flash";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "feeling": return "bg-pink-500/30";
      case "thought": return "bg-yellow-500/30";
      case "action": return "bg-purple-500/30";
      default: return "bg-purple-500/30";
    }
  };

  if (showCreateAlert) {
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          <View className="flex-1 px-6">
            {/* Header */}
            <View className="flex-row items-center justify-between py-4">
              <Pressable onPress={() => setShowCreateAlert(false)}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </Pressable>
              <Text className="text-white text-xl font-semibold">New Twintuition</Text>
              <View className="w-6" />
            </View>

            <ScrollView className="flex-1">
              {/* Type Selection */}
              <View className="mb-6">
                <Text className="text-white text-lg font-semibold mb-4">What type of connection?</Text>
                <View className="space-y-3">
                  {[
                    { key: "feeling" as const, name: "Feeling", icon: "heart", description: "Emotional connection" },
                    { key: "thought" as const, name: "Thought", icon: "bulb", description: "Mental synchronicity" },
                    { key: "action" as const, name: "Action", icon: "flash", description: "Behavioral mirroring" },
                  ].map((type) => (
                    <Pressable
                      key={type.key}
                      onPress={() => setSelectedType(type.key)}
                      className={`p-4 rounded-xl border-2 ${
                        selectedType === type.key
                          ? "bg-white/20 border-white/50"
                          : "bg-white/5 border-white/20"
                      }`}
                    >
                      <View className="flex-row items-center">
                        <View className={`p-3 rounded-full mr-4 ${getTypeColor(type.key)}`}>
                          <Ionicons name={type.icon as any} size={20} color="white" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white text-lg font-semibold">{type.name}</Text>
                          <Text className="text-white/70 text-sm">{type.description}</Text>
                        </View>
                        <Ionicons
                          name={selectedType === type.key ? "radio-button-on" : "radio-button-off"}
                          size={24}
                          color="white"
                        />
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Message Input */}
              <View className="mb-6">
                <Text className="text-white text-lg font-semibold mb-4">Describe your twintuition</Text>
                <View className="bg-white/10 rounded-xl p-4">
                  <TextInput
                    value={alertMessage}
                    onChangeText={setAlertMessage}
                    placeholder="I have a feeling that my twin is..."
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    className="text-white text-base"
                    multiline
                    numberOfLines={4}
                    maxLength={200}
                  />
                </View>
                <Text className="text-white/50 text-sm mt-2 text-right">
                  {alertMessage.length}/200
                </Text>
              </View>

              {/* Send Button */}
              <Pressable
                onPress={handleCreateAlert}
                className={`py-4 rounded-xl items-center ${
                  alertMessage.trim() ? "bg-purple-500" : "bg-white/20"
                }`}
                disabled={!alertMessage.trim()}
              >
                <Text className="text-white text-lg font-semibold">
                  Send Twintuition Alert
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6">
          {/* Header */}
          <View className="flex-row items-center justify-between py-4">
            <Pressable onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
              <Ionicons name="chevron-back" size={20} color="white" />
            </Pressable>
            <Text className="text-white text-2xl font-bold">Twintuition</Text>
            <Pressable
              onPress={() => setShowCreateAlert(true)}
              className="bg-purple-500 rounded-full p-2"
            >
              <Ionicons name="add" size={24} color="white" />
            </Pressable>
          </View>

          <Text className="text-white/70 text-center mb-6">
            Feel your twin's energy across any distance
          </Text>

          {/* Alerts List */}
          <ScrollView className="flex-1">
            {twintuitionAlerts.length === 0 ? (
              <View className="bg-white/5 rounded-xl p-8 items-center mt-8">
                <Ionicons name="flash-outline" size={64} color="rgba(255,255,255,0.3)" />
                <Text className="text-white/70 text-lg text-center mt-4">
                  No twintuition alerts yet
                </Text>
                <Text className="text-white/50 text-center mt-2">
                  Create your first alert to start sensing your twin's energy
                </Text>
              </View>
            ) : (
              <View className="space-y-4">
                {twintuitionAlerts.map((alert) => (
                  <Pressable
                    key={alert.id}
                    onPress={() => markAlertAsRead(alert.id)}
                    className={`p-4 rounded-xl ${
                      alert.isRead ? "bg-white/5" : "bg-white/15 border border-purple-400/50"
                    }`}
                  >
                    <View className="flex-row items-start">
                      <View className={`p-2 rounded-full mr-3 ${getTypeColor(alert.type)}`}>
                        <Ionicons 
                          name={getTypeIcon(alert.type) as any} 
                          size={16} 
                          color="white" 
                        />
                      </View>
                      
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-2">
                          <Text className="text-white/70 text-sm capitalize">
                            {alert.type} • {formatTime(alert.timestamp)}
                          </Text>
                          {!alert.isRead && (
                            <View className="w-2 h-2 bg-purple-400 rounded-full" />
                          )}
                        </View>
                        
                        <Text className="text-white text-base leading-5">
                          {alert.message}
                        </Text>
                        
                        <View className="flex-row items-center mt-3 pt-3 border-t border-white/10">
                          <View className="bg-white/20 rounded-full w-6 h-6 items-center justify-center mr-2">
                            <Text className="text-white text-xs font-bold">
                              {twinProfile?.name?.charAt(0) || "T"}
                            </Text>
                          </View>
                          <Text className="text-white/50 text-sm">
                            Sent to {twinProfile?.name || "your twin"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};