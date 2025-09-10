import React from "react";
import { View, Text, Pressable } from "react-native";
import { ProgressBar } from "./ProgressBar";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface ComparisonChartProps {
  userScores: {
    emotionalConnection: number;
    telepathicExperiences: number;
    behavioralSynchrony: number;
    sharedExperiences: number;
    physicalSensations: number;
  };
  twinScores: {
    emotionalConnection: number;
    telepathicExperiences: number;
    behavioralSynchrony: number;
    sharedExperiences: number;
    physicalSensations: number;
  };
  accentColor: string;
  onCategorySelect?: (category: string) => void;
  selectedCategory?: string | null;
}

const CATEGORY_INFO = {
  emotionalConnection: {
    name: "Emotional Connection",
    icon: "heart",
    color: "#ff1493"
  },
  telepathicExperiences: {
    name: "Telepathic Experiences", 
    icon: "flash",
    color: "#8a2be2"
  },
  behavioralSynchrony: {
    name: "Behavioral Synchrony",
    icon: "people",
    color: "#00bfff"
  },
  sharedExperiences: {
    name: "Shared Experiences",
    icon: "star",
    color: "#00ff7f"
  },
  physicalSensations: {
    name: "Physical Sensations",
    icon: "hand-left",
    color: "#ff4500"
  }
};

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  userScores,
  twinScores,
  accentColor,
  onCategorySelect,
  selectedCategory
}) => {
  const scaleValue = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }]
  }));

  return (
    <Animated.View style={animatedStyle} className="space-y-4">
      {Object.entries(userScores).map(([categoryKey, userScore]) => {
        const category = CATEGORY_INFO[categoryKey as keyof typeof CATEGORY_INFO];
        const twinScore = twinScores[categoryKey as keyof typeof twinScores];
        const difference = userScore - twinScore;
        const isSelected = selectedCategory === categoryKey;
        
        return (
          <Pressable 
            key={categoryKey}
            onPress={() => {
              scaleValue.value = withSpring(0.98, {}, () => {
                scaleValue.value = withSpring(1);
              });
              onCategorySelect?.(categoryKey);
            }}
            className={`rounded-xl p-4 ${
              isSelected ? 'bg-white/15' : 'bg-white/5'
            }`}
            style={isSelected ? { borderColor: accentColor, borderWidth: 1 } : {}}
          >
            {/* Category Header */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1">
                <View 
                  className="w-8 h-8 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: `${category.color}30` }}
                >
                  <Ionicons name={category.icon as any} size={16} color={category.color} />
                </View>
                <Text className="text-white font-medium flex-1">{category.name}</Text>
              </View>
              
              {/* Difference Indicator */}
              <View className="items-center">
                {difference > 0 ? (
                  <View className="flex-row items-center">
                    <Text className="text-green-400 text-xs font-bold">+{Math.abs(difference)}</Text>
                    <Ionicons name="trending-up" size={12} color="#10b981" />
                  </View>
                ) : difference < 0 ? (
                  <View className="flex-row items-center">
                    <Text className="text-red-400 text-xs font-bold">-{Math.abs(difference)}</Text>
                    <Ionicons name="trending-down" size={12} color="#ef4444" />
                  </View>
                ) : (
                  <View className="flex-row items-center">
                    <Text className="text-gray-400 text-xs font-bold">0</Text>
                    <Ionicons name="remove" size={12} color="#6b7280" />
                  </View>
                )}
              </View>
            </View>
            
            {/* Comparison Bars */}
            <View className="space-y-3">
              {/* User Score */}
              <View>
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-white/70 text-xs">You</Text>
                  <Text className="text-white text-xs font-bold">{userScore}%</Text>
                </View>
                <ProgressBar 
                  progress={userScore} 
                  color={accentColor} 
                  height={4}
                />
              </View>
              
              {/* Twin Score */}
              <View>
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-white/70 text-xs">Twin</Text>
                  <Text className="text-white text-xs font-bold">{twinScore}%</Text>
                </View>
                <ProgressBar 
                  progress={twinScore} 
                  color="#6b7280" 
                  height={4}
                />
              </View>
            </View>
            
            {/* Compatibility Score for this category */}
            <View className="mt-3 pt-3 border-t border-white/10">
              <View className="flex-row justify-between items-center">
                <Text className="text-white/60 text-xs">Compatibility:</Text>
                <Text className="text-white text-xs font-medium">
                  {Math.max(0, 100 - Math.abs(difference))}%
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
      
      {/* Legend */}
      <View className="bg-white/5 rounded-xl p-3 mt-2">
        <View className="flex-row items-center justify-center space-x-6">
          <View className="flex-row items-center">
            <View 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: accentColor }}
            />
            <Text className="text-white/70 text-xs">Your Scores</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-gray-500 mr-2" />
            <Text className="text-white/70 text-xs">Twin Scores</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};