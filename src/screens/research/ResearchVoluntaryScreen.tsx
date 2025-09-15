import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { researchService } from "../../services/researchService";
import { useTwinStore } from "../../state/twinStore";
import { getNeonAccentColor } from "../../utils/neonColors";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ResearchVoluntaryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const userProfile = useTwinStore((state) => state.userProfile);
  const [agreedToVoluntary, setAgreedToVoluntary] = useState(false);
  const accentColor = userProfile?.accentColor || "neon-purple";
  const neonColor = getNeonAccentColor(accentColor);

  const handleLearnMore = () => {
    navigation.navigate("ResearchParticipation");
  };

  const handleNotInterested = () => {
    Alert.alert(
      "No Problem!",
      "Research participation is completely optional. You can always find this in Settings if you change your mind.",
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  return (
    <View className="flex-1 bg-black">
      <Image
        source={require("../../../assets/galaxybackground.png")}
        className="absolute inset-0 w-full h-full"
        contentFit="cover"
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        transition={200}
      />
      <SafeAreaView className="flex-1">
        <ScrollView 
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Header */}
          <View className="mt-8 mb-6">
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="absolute left-0 top-0 z-10"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <Text className="text-white text-3xl font-bold text-center">
              Voluntary Research
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              Help Advance Twin Science
            </Text>
          </View>

          {/* Important Notice */}
          <LinearGradient
            colors={[`${neonColor}20`, 'rgba(0, 0, 0, 0.4)', `${neonColor}10`]}
            className="p-6 rounded-2xl mb-6 border"
            style={{ borderColor: `${neonColor}40` }}
          >
            <View className="flex-row items-center mb-4">
              <View 
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: `${neonColor}30` }}
              >
                <Ionicons name="information-circle" size={24} color={neonColor} />
              </View>
              <Text className="text-white text-xl font-bold flex-1">
                100% Voluntary
              </Text>
            </View>
            
            <Text className="text-gray-300 text-base leading-6">
              Research participation is completely optional and separate from all app features. 
              Your Twinship experience remains exactly the same whether you participate or not.
            </Text>
          </LinearGradient>

          {/* What This Means */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-4">
              What This Means:
            </Text>
            
            {[
              {
                icon: "checkmark-circle",
                title: "No Features Locked",
                description: "All app features work the same regardless of participation"
              },
              {
                icon: "gift",
                title: "No Special Benefits",
                description: "Participants don't get extra features or premium access"
              },
              {
                icon: "shield-checkmark",
                title: "Your Choice",
                description: "You can join, skip, or withdraw anytime without any impact"
              },
              {
                icon: "heart",
                title: "Pure Contribution",
                description: "Participation is purely to help advance twin research"
              }
            ].map((item, index) => (
              <View key={index} className="flex-row items-start mb-4">
                <Ionicons 
                  name={item.icon as any} 
                  size={24} 
                  color={neonColor} 
                  style={{ marginTop: 2, marginRight: 12 }}
                />
                <View className="flex-1">
                  <Text className="text-white font-semibold mb-1">
                    {item.title}
                  </Text>
                  <Text className="text-gray-400 text-sm">
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Why Research Matters */}
          <View className="bg-gray-800/30 p-5 rounded-2xl mb-6">
            <Text className="text-white text-lg font-semibold mb-3">
              Why Twin Research Matters
            </Text>
            <Text className="text-gray-300 leading-6 mb-3">
              Twin studies have contributed to breakthroughs in genetics, psychology, 
              and medicine. By participating, you're helping researchers understand:
            </Text>
            <View className="ml-4">
              {[
                "The nature of twin bonds and connections",
                "How twins communicate and synchronize",
                "Emotional and psychological twin dynamics",
                "Factors that strengthen twin relationships"
              ].map((item, index) => (
                <View key={index} className="flex-row items-center mb-2">
                  <Text className="text-gray-400 mr-2">•</Text>
                  <Text className="text-gray-300 flex-1">{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* What You'll Receive */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-3">
              If You Choose to Participate:
            </Text>
            <View className="bg-gray-800/20 p-4 rounded-xl">
              {[
                "Acknowledgment in scientific publications (optional)",
                "Research newsletter with study updates",
                "Published study results when available",
                "Certificate of participation",
                "The satisfaction of contributing to science"
              ].map((item, index) => (
                <View key={index} className="flex-row items-center mb-3">
                  <Ionicons 
                    name="arrow-forward" 
                    size={16} 
                    color={neonColor} 
                    style={{ marginRight: 10 }}
                  />
                  <Text className="text-gray-300 flex-1">{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Confirmation Checkbox */}
          <TouchableOpacity
            onPress={() => setAgreedToVoluntary(!agreedToVoluntary)}
            className="flex-row items-center mb-6 p-4 rounded-xl bg-gray-800/30"
          >
            <View 
              className="w-6 h-6 rounded border-2 mr-3 items-center justify-center"
              style={{ borderColor: agreedToVoluntary ? neonColor : '#6b7280' }}
            >
              {agreedToVoluntary && (
                <Ionicons name="checkmark" size={16} color={neonColor} />
              )}
            </View>
            <Text className="text-gray-300 flex-1">
              I understand that research participation is completely voluntary 
              and does not affect my app experience in any way
            </Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View className="space-y-3">
            <TouchableOpacity
              onPress={handleLearnMore}
              disabled={!agreedToVoluntary}
              className={`p-4 rounded-xl ${agreedToVoluntary ? '' : 'opacity-50'}`}
              style={{ 
                backgroundColor: agreedToVoluntary ? neonColor : '#374151'
              }}
            >
              <Text className={`text-center font-bold text-lg ${
                agreedToVoluntary ? 'text-black' : 'text-gray-500'
              }`}>
                Learn About Studies
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNotInterested}
              className="p-4 rounded-xl border border-gray-600"
            >
              <Text className="text-gray-400 text-center font-semibold">
                Not Interested Right Now
              </Text>
            </TouchableOpacity>
          </View>

          {/* Privacy Note */}
          <View className="mt-8 p-4 bg-gray-900/50 rounded-xl">
            <View className="flex-row items-center mb-2">
              <Ionicons name="lock-closed" size={16} color="#6b7280" />
              <Text className="text-gray-500 text-sm font-semibold ml-2">
                Privacy Protected
              </Text>
            </View>
            <Text className="text-gray-600 text-xs leading-5">
              All research data is anonymized and handled according to strict 
              ethical guidelines. Your personal information is never shared. 
              You can withdraw and request data deletion at any time.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};