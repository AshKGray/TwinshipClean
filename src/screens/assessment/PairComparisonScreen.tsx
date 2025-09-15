import React, { useState } from "react";
import { View, Text, Pressable, ScrollViewBackground } from "react-native";
import { ImageBackground } from "expo-image";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTwinStore } from "../../state/twinStore";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ComparisonChart } from "../../components/assessment/ComparisonChart";
import { CompatibilityMeter } from "../../components/assessment/CompatibilityMeter";
import { DifferenceIndicator } from "../../components/assessment/DifferenceIndicator";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

// Mock data - in real app this would come from both twins' assessments
const MOCK_TWIN_RESULTS = {
  user: {
    overallScore: 78,
    categoryScores: {
      emotionalConnection: 85,
      telepathicExperiences: 72,
      behavioralSynchrony: 80,
      sharedExperiences: 75,
      physicalSensations: 68,
    },
    level: "Strong" as const
  },
  twin: {
    overallScore: 71,
    categoryScores: {
      emotionalConnection: 78,
      telepathicExperiences: 88,
      behavioralSynchrony: 65,
      sharedExperiences: 70,
      physicalSensations: 74,
    },
    level: "Strong" as const
  }
};

const COMPATIBILITY_INSIGHTS = [
  {
    type: "strength" as const,
    title: "Emotional Harmony",
    description: "You both score high in emotional connection, indicating a strong empathic bond.",
    icon: "heart",
    difference: 7
  },
  {
    type: "balance" as const,
    title: "Telepathic Balance",
    description: "Your twin shows stronger telepathic abilities while you excel in behavioral sync.",
    icon: "swap-horizontal",
    difference: -16
  },
  {
    type: "growth" as const,
    title: "Physical Sensitivity",
    description: "Both of you can work on developing physical sensation sharing.",
    icon: "trending-up",
    difference: -6
  },
  {
    type: "synergy" as const,
    title: "Complementary Strengths",
    description: "Your different strength areas create a well-rounded intuitive partnership.",
    icon: "people",
    difference: 0
  }
];

interface InsightType {
  type: 'strength' | 'balance' | 'growth' | 'synergy';
  title: string;
  description: string;
  icon: string;
  difference: number;
}

export const PairComparisonScreen = () => {
  const { userProfile, twinProfile } = useTwinStore();
  const navigation = useNavigation<any>();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const themeColor = userProfile?.accentColor || "neon-purple";
  
  const getAccentColor = () => {
    switch (themeColor) {
      case "neon-pink": return "#ff1493";
      case "neon-blue": return "#00bfff";
      case "neon-green": return "#00ff7f";
      case "neon-yellow": return "#ffff00";
      case "neon-purple": return "#8a2be2";
      case "neon-orange": return "#ff4500";
      case "neon-cyan": return "#00ffff";
      case "neon-red": return "#ff0000";
      default: return "#8a2be2";
    }
  };

  const accentColor = getAccentColor();
  
  // Calculate overall compatibility (0-100)
  const calculateCompatibility = () => {
    const userScores = Object.values(MOCK_TWIN_RESULTS.user.categoryScores);
    const twinScores = Object.values(MOCK_TWIN_RESULTS.twin.categoryScores);
    
    let totalDifference = 0;
    for (let i = 0; i < userScores.length; i++) {
      totalDifference += Math.abs(userScores[i] - twinScores[i]);
    }
    
    const averageDifference = totalDifference / userScores.length;
    return Math.max(0, 100 - averageDifference);
  };
  
  const compatibilityScore = calculateCompatibility();
  
  // Animation
  const fadeIn = useSharedValue(0);
  
  React.useEffect(() => {
    fadeIn.value = withSpring(1);
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value
  }));

  const getInsightColor = (type: InsightType['type']) => {
    switch (type) {
      case 'strength': return '#10b981';
      case 'balance': return '#3b82f6';
      case 'growth': return '#f59e0b';
      case 'synergy': return '#8b5cf6';
      default: return accentColor;
    }
  };

  const categoryNames = {
    emotionalConnection: "Emotional Connection",
    telepathicExperiences: "Telepathic Experiences",
    behavioralSynchrony: "Behavioral Synchrony", 
    sharedExperiences: "Shared Experiences",
    physicalSensations: "Physical Sensations"
  };

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}
      contentFit="cover"
      placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
      transition={200}>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={28} color="white" />
            </Pressable>
            
            <Text className="text-white text-xl font-bold">Twin Comparison</Text>
            
            <View className="w-7" />
          </View>
        </View>

        <ScrollView className="flex-1 px-6">
          <Animated.View style={animatedStyle} className="space-y-6">
            
            {/* Twin Profiles */}
            <View className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                {/* User Profile */}
                <View className="items-center flex-1">
                  <View className="bg-white/20 rounded-full w-16 h-16 items-center justify-center mb-2">
                    <Text className="text-white text-2xl font-bold">
                      {userProfile?.name?.charAt(0) || "U"}
                    </Text>
                  </View>
                  <Text className="text-white font-semibold">{userProfile?.name}</Text>
                  <Text className="text-white/70 text-sm">{MOCK_TWIN_RESULTS.user.level}</Text>
                  <Text className="font-bold mt-1" style={{ color: accentColor }}>
                    {MOCK_TWIN_RESULTS.user.overallScore}%
                  </Text>
                </View>
                
                {/* Connection Symbol */}
                <View className="mx-4">
                  <View 
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${accentColor}30` }}
                  >
                    <Ionicons name="link" size={20} color={accentColor} />
                  </View>
                </View>
                
                {/* Twin Profile */}
                <View className="items-center flex-1">
                  <View className="bg-white/20 rounded-full w-16 h-16 items-center justify-center mb-2">
                    <Text className="text-white text-2xl font-bold">
                      {twinProfile?.name?.charAt(0) || "T"}
                    </Text>
                  </View>
                  <Text className="text-white font-semibold">{twinProfile?.name}</Text>
                  <Text className="text-white/70 text-sm">{MOCK_TWIN_RESULTS.twin.level}</Text>
                  <Text className="font-bold mt-1" style={{ color: accentColor }}>
                    {MOCK_TWIN_RESULTS.twin.overallScore}%
                  </Text>
                </View>
              </View>
              
              {/* Overall Compatibility */}
              <View className="border-t border-white/10 pt-4">
                <Text className="text-white text-center font-medium mb-2">Overall Compatibility</Text>
                <CompatibilityMeter 
                  score={compatibilityScore} 
                  color={accentColor}
                  showPercentage
                />
              </View>
            </View>

            {/* Category Comparison Chart */}
            <View className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <Text className="text-white text-lg font-semibold mb-4">Detailed Comparison</Text>
              <ComparisonChart 
                userScores={MOCK_TWIN_RESULTS.user.categoryScores}
                twinScores={MOCK_TWIN_RESULTS.twin.categoryScores}
                accentColor={accentColor}
                onCategorySelect={setSelectedCategory}
                selectedCategory={selectedCategory}
              />
            </View>

            {/* Category Details */}
            <View className="space-y-3">
              {Object.entries(MOCK_TWIN_RESULTS.user.categoryScores).map(([category, userScore]) => {
                const twinScore = MOCK_TWIN_RESULTS.twin.categoryScores[category as keyof typeof MOCK_TWIN_RESULTS.twin.categoryScores];
                const difference = userScore - twinScore;
                
                return (
                  <Pressable 
                    key={category}
                    onPress={() => setSelectedCategory(selectedCategory === category ? null : category)}
                    className={`bg-white/5 rounded-xl p-4 ${
                      selectedCategory === category ? 'ring-2' : ''
                    }`}
                    style={selectedCategory === category ? { borderColor: accentColor, borderWidth: 1 } : {}}
                  >
                    <View className="flex-row justify-between items-center">
                      <Text className="text-white font-medium flex-1">
                        {categoryNames[category as keyof typeof categoryNames]}
                      </Text>
                      <DifferenceIndicator 
                        difference={difference}
                        accentColor={accentColor}
                      />
                    </View>
                    
                    <View className="flex-row items-center mt-3 space-x-4">
                      <View className="flex-1">
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-white/70 text-xs">You</Text>
                          <Text className="text-white text-xs font-bold">{userScore}%</Text>
                        </View>
                        <View className="bg-white/10 rounded-full h-2 overflow-hidden">
                          <View 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${userScore}%`,
                              backgroundColor: accentColor
                            }}
                          />
                        </View>
                      </View>
                      
                      <View className="flex-1">
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-white/70 text-xs">Twin</Text>
                          <Text className="text-white text-xs font-bold">{twinScore}%</Text>
                        </View>
                        <View className="bg-white/10 rounded-full h-2 overflow-hidden">
                          <View 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${twinScore}%`,
                              backgroundColor: '#6b7280'
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Compatibility Insights */}
            <View className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <Text className="text-white text-lg font-semibold mb-4">Compatibility Insights</Text>
              
              <View className="space-y-4">
                {COMPATIBILITY_INSIGHTS.map((insight, index) => (
                  <View key={index} className="bg-white/5 rounded-xl p-4">
                    <View className="flex-row items-center mb-2">
                      <View 
                        className="w-8 h-8 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: `${getInsightColor(insight.type)}30` }}
                      >
                        <Ionicons 
                          name={insight.icon as any} 
                          size={16} 
                          color={getInsightColor(insight.type)} 
                        />
                      </View>
                      <Text className="text-white font-medium flex-1">{insight.title}</Text>
                      {insight.difference !== 0 && (
                        <DifferenceIndicator 
                          difference={insight.difference}
                          accentColor={accentColor}
                          size="small"
                        />
                      )}
                    </View>
                    <Text className="text-white/70 text-sm ml-11">{insight.description}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View className="space-y-3">
              <Pressable 
                onPress={() => navigation.navigate("AssessmentRecommendations" as never)}
                className="rounded-xl py-4 px-6 flex-row items-center justify-center"
                style={{ backgroundColor: accentColor }}
              >
                <Ionicons name="bulb-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Get Joint Exercises</Text>
              </Pressable>
              
              <Pressable 
                className="bg-white/10 rounded-xl py-4 px-6 flex-row items-center justify-center"
              >
                <Ionicons name="share-outline" size={20} color="white" />
                <Text className="text-white font-medium ml-2">Share Comparison</Text>
              </Pressable>
            </View>

            <View className="h-6" />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};