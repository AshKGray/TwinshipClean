import React, { useMemo, useState, useEffect } from "react";
import { View, Text, Pressable, TextInput, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useTwinStore, useTempTwinStore, TwinProfile, TwinType, ThemeColor } from "../state/twinStore";
import { useAuth } from "../state/authStore";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { v4 as uuidv4 } from "uuid";

export const PairScreen = () => {
  console.log("=== PairScreen component rendering ===");
  const navigation = useNavigation<any>();
  const { themeColor, shareCode, setShareCode, paired, setPaired, userProfile, twinProfile } = useTwinStore();
  const { setConnectionStatus } = useTempTwinStore();
  const { user, logout } = useAuth();
  const [enteredCode, setEnteredCode] = useState("");
  const [statusText, setStatusText] = useState("");
  
  console.log("Current state - enteredCode:", enteredCode, "paired:", paired, "statusText:", statusText);

  const code = useMemo(() => {
    if (shareCode) return shareCode;
    const generated = uuidv4().split("-")[0].toUpperCase();
    setShareCode(generated);
    return generated;
  }, [shareCode]);

  const copyCode = async () => {
    await Clipboard.setStringAsync(code);
    setStatusText("Code copied. Share with your twin.");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const ensureDevUser = (name: string = "Jordan") => {
    const state = useTwinStore.getState();
    if (!state.userProfile) {
      const devUser: TwinProfile = {
        id: "test-user-" + Date.now(),
        name,
        age: 26,
        gender: "Non-binary",
        twinType: "identical" as TwinType,
        birthDate: new Date().toISOString(),
        accentColor: "neon-purple" as ThemeColor,
        isConnected: true,
      };
      state.setUserProfile(devUser);
    }
  };

  const createDevPair = (meName: string, twinName: string) => {
    console.log("createDevPair called with:", meName, twinName);
    const state = useTwinStore.getState();
    ensureDevUser(meName);
    const me: TwinProfile = {
      id: "test-user-" + Date.now(),
      name: meName,
      age: 26,
      gender: "Non-binary",
      twinType: "identical" as TwinType,
      birthDate: new Date().toISOString(),
      accentColor: "neon-purple" as ThemeColor,
      isConnected: true,
    };
    state.setUserProfile(me);

    const accent: ThemeColor = (meName === "Alex" ? "neon-pink" : "neon-purple") as ThemeColor;
    const mockTwin: TwinProfile = {
      id: "test-twin-" + Date.now(),
      name: twinName,
      age: 25,
      gender: "Non-binary",
      twinType: "identical" as TwinType,
      birthDate: new Date().toISOString(),
      accentColor: accent,
      isConnected: true,
      lastSeen: new Date().toISOString()
    };

    console.log("Created mock twin:", mockTwin);
    state.setTwinProfile(mockTwin);
    setPaired(true);
    setConnectionStatus("connected");
    setStatusText(`Connected to test twin: ${mockTwin.name}! 🎉`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => {
      const { useChatStore } = require('../state/chatStore');
      const chatStore = useChatStore.getState();
      chatStore.addMessage({
        text: `Hey twin! I'm ${mockTwin.name}. This is a dev pairing.`,
        senderId: mockTwin.id,
        senderName: mockTwin.name,
        type: 'text' as const,
      });
    }, 400);

    setTimeout(() => {
      console.log("About to navigate to chat from createDevPair");
      navigation.navigate("Main", { screen: "Twinbox" });
    }, 1000);
  };

  const createTestTwin = () => {
    // Create a mock twin profile for testing
    const mockTwin: TwinProfile = {
      id: "test-twin-" + Date.now(),
      name: userProfile?.name === "Alex" ? "Jordan" : "Alex",
      age: userProfile?.age ? userProfile.age + Math.floor(Math.random() * 3) - 1 : 25,
      gender: userProfile?.gender === "Male" ? "Female" : userProfile?.gender === "Female" ? "Male" : "Non-binary",
      twinType: (userProfile?.twinType || "identical") as TwinType,
      birthDate: userProfile?.birthDate || new Date().toISOString(),
      accentColor: (userProfile?.accentColor === "neon-purple" ? "neon-pink" : "neon-purple") as ThemeColor,
      isConnected: true,
      lastSeen: new Date().toISOString()
    };
    
    useTwinStore.getState().setTwinProfile(mockTwin);
    setPaired(true);
    setConnectionStatus("connected");
    setStatusText(`Connected to test twin: ${mockTwin.name}! 🎉`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Send welcome message from test twin
    setTimeout(() => {
      const { useChatStore } = require('../state/chatStore');
      const chatStore = useChatStore.getState();
      
      const welcomeMessage = {
        id: Date.now().toString() + Math.random().toString(36),
        text: `Hey twin! 👋 I'm your test twin ${mockTwin.name}. I'm here to chat and test all the amazing twin features with you! Try sending me a message - I'll respond with that magical twin telepathy! ✨💫`,
        senderId: mockTwin.id,
        senderName: mockTwin.name,
        timestamp: new Date().toISOString(),
        type: 'text' as const,
        isDelivered: true,
        isRead: false,
        reactions: [],
      };
      
      chatStore.addMessage(welcomeMessage);
    }, 500);
    
    // Auto-navigate to chat after successful test pairing
    setTimeout(() => {
      navigation.navigate("Main", { screen: "Twinbox" });
    }, 1500); // Short delay to show success message
  };

  const connect = async () => {
    console.log("=== CONNECT FUNCTION CALLED ===");
    console.log("enteredCode:", enteredCode);
    console.log("enteredCode length:", enteredCode.length);
    console.log("enteredCode type:", typeof enteredCode);
    
    // Simple test first - just update status text
    setStatusText("Button clicked! Processing...");
    
    const cleaned = enteredCode.trim();
    console.log("cleaned code:", cleaned);
    console.log("cleaned code length:", cleaned.length);
    
    if (!cleaned) {
      console.log("No code entered");
      setStatusText("Enter your twin's code to connect.");
      return;
    }
    
    console.log("Cleaned code:", cleaned);
    console.log("Checking if code is TEST:", cleaned.toUpperCase() === "TEST");
    
    // Special test codes for development
    if (cleaned.toUpperCase() === "TEST") {
      console.log("TEST code detected, creating dev pair");
      setStatusText("TEST code detected! Creating dev pair...");
      // Default: you as Jordan, twin as Alex
      try {
        createDevPair("Jordan", "Alex");
      } catch (error) {
        console.error("Error in createDevPair:", error);
        setStatusText("Error creating dev pair: " + String(error));
      }
      return;
    }
    if (cleaned.toUpperCase() === "TESTTWIN") {
      console.log("TESTTWIN code detected, creating dev pair");
      setStatusText("TESTTWIN code detected! Creating dev pair...");
      // Swap roles: you as Alex, twin as Jordan
      try {
        createDevPair("Alex", "Jordan");
      } catch (error) {
        console.error("Error in createDevPair:", error);
        setStatusText("Error creating dev pair: " + String(error));
      }
      return;
    }
    
    console.log("Regular code path, setting connected status");
    // For MVP demo, accept any non-empty code
    setPaired(true);
    setConnectionStatus("connected");
    setStatusText("Connected! You can start chatting.");
    
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Haptics error:", error);
    }
    
    // Auto-navigate to Twin Talk after successful pairing
    setTimeout(() => {
      console.log("Navigating to chat tab");
      try {
        navigation.navigate("Main", { screen: "Twinbox" });
      } catch (error) {
        console.error("Navigation error:", error);
        setStatusText("Navigation error: " + String(error));
      }
    }, 1500); // Short delay to show success message
  };

  const disconnect = () => {
    setPaired(false);
    setConnectionStatus("disconnected");
    setStatusText("Disconnected.");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Auto-navigate to TwinTalk when successfully paired
  useEffect(() => {
    if (paired && userProfile && twinProfile) {
      const timer = setTimeout(() => {
        navigation.navigate("Main", { screen: "Twinbox" });
      }, 1200); // Short delay to show success message
      
      return () => clearTimeout(timer);
    }
  }, [paired, userProfile, twinProfile, navigation]);

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6">
          {/* Header */}
          <View className="flex-row items-center justify-between py-4">
            <Pressable onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
              <Ionicons name="chevron-back" size={20} color="white" />
            </Pressable>
            <Text className="text-white text-xl font-bold flex-1 text-center">Pair with Your Twin</Text>
            {paired && (
              <Pressable onPress={disconnect} className="bg-white/10 rounded-full px-3 py-2">
                <Text className="text-white">Disconnect</Text>
              </Pressable>
            )}
          </View>

          {/* Share Code */}
          <View className="bg-white/10 rounded-xl p-6 mb-6 items-center">
            <Text className="text-white/70">Your Share Code</Text>
            <Text className="text-white text-4xl font-extrabold tracking-widest mt-2">{code}</Text>
            <Pressable onPress={copyCode} className="mt-4 bg-white/20 px-4 py-2 rounded-full">
              <Text className="text-white font-semibold">Copy Code</Text>
            </Pressable>
            <Text className="text-white/60 text-sm mt-3 text-center">
              Ask your twin to enter this code on their device to connect.
            </Text>
          </View>

          {/* Enter Twin Code */}
          <View className="bg-white/10 rounded-xl p-6 mb-4">
            <Text className="text-white text-lg font-semibold mb-3">Enter Twin's Code</Text>
            <TextInput
              value={enteredCode}
              onChangeText={(text) => {
                console.log("Text changed to:", text);
                setEnteredCode(text);
              }}
              onSubmitEditing={() => {
                console.log("Enter key pressed, calling connect");
                connect();
              }}
              placeholder="e.g. 9F2C7A"
              placeholderTextColor="rgba(255,255,255,0.5)"
              className="bg-white/10 rounded-xl px-4 py-4 text-white text-lg tracking-widest"
              autoCapitalize="characters"
              maxLength={8}
              returnKeyType="go"
              blurOnSubmit={false}
            />
            <Pressable 
              onPress={() => {
                console.log("Continue button pressed!");
                console.log("Current enteredCode:", enteredCode);
                try {
                  connect();
                } catch (error) {
                  console.error("Error in connect function:", error);
                }
              }}
              onPressIn={() => console.log("Button press started")}
              onPressOut={() => console.log("Button press ended")}
              className="mt-4 bg-purple-500 rounded-xl py-3 items-center"
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  zIndex: 1000
                }
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="text-white font-semibold">Continue</Text>
            </Pressable>
            {statusText.length > 0 && (
              <Text className="text-white/70 text-center mt-3">{statusText}</Text>
            )}
          </View>

          {/* Development Test Mode */}
          <View className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/30">
            <Text className="text-yellow-200 text-sm font-medium mb-2">🧪 Development Mode</Text>
            <Text className="text-yellow-100/80 text-xs leading-5">
              For testing, enter "TEST" or "TESTTWIN" as the code to instantly connect with a mock twin profile.
            </Text>
          </View>

          {/* Status */}
          <View className="bg-white/5 rounded-xl p-4 mt-2">
            <Text className="text-white/80">Status</Text>
            <Text className="text-white text-lg mt-1">{paired ? "Connected" : "Not connected"}</Text>
            <Text className="text-white/70 text-sm mt-2">
              {userProfile?.name || "You"} ↔ {twinProfile?.name || "Your Twin"}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};