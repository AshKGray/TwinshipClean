import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { ProgressBar } from "./ProgressBar";
import { Ionicons } from "@expo/vector-icons";

interface CategoryChartProps {
  categoryScores: {
    emotionalConnection: number;
    telepathicExperiences: number;
    behavioralSynchrony: number;
    sharedExperiences: number;
    physicalSensations: number;
  };
  accentColor: string;
}

const CATEGORY_INFO = {
  emotionalConnection: {
    name: "Emotional Connection",
    icon: "heart",
    color: "#ff1493",
    description: "Your ability to sense and share emotions with your twin"
  },
  telepathicExperiences: {
    name: "Telepathic Experiences", 
    icon: "flash",
    color: "#8a2be2",
    description: "Mind-to-mind communication and thought sharing"
  },
  behavioralSynchrony: {
    name: "Behavioral Synchrony",
    icon: "people",
    color: "#00bfff",
    description: "Simultaneous actions and mirrored behaviors"
  },
  sharedExperiences: {
    name: "Shared Experiences",
    icon: "star",
    color: "#00ff7f",
    description: "Similar life events and parallel experiences"
  },
  physicalSensations: {
    name: "Physical Sensations",
    icon: "hand-left",
    color: "#ff4500",
    description: "Feeling your twin's physical state and sensations"
  }
};

export const CategoryChart: React.FC<CategoryChartProps> = ({
  categoryScores,
  accentColor
}) => {
  const getScoreLevel = (score: number) => {
    if (score >= 80) return { level: "Excellent", color: "#10b981" };
    if (score >= 60) return { level: "Good", color: "#3b82f6" };
    if (score >= 40) return { level: "Developing", color: "#f59e0b" };
    return { level: "Emerging", color: "#ef4444" };
  };

  return (
    <ScrollView className="space-y-4" showsVerticalScrollIndicator={false}>
      {Object.entries(categoryScores).map(([categoryKey, score]) => {
        const category = CATEGORY_INFO[categoryKey as keyof typeof CATEGORY_INFO];
        const scoreLevel = getScoreLevel(score);
        
        return (
          <View key={categoryKey} className="bg-white/5 rounded-xl p-4">
            {/* Category Header */}
            <View className="flex-row items-center mb-3">
              <View 
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${category.color}30` }}
              >
                <Ionicons name={category.icon as any} size={20} color={category.color} />
              </View>
              <View className="flex-1">
                <Text className="text-white font-medium">{category.name}</Text>
                <Text className="text-white/60 text-xs">{category.description}</Text>
              </View>
              <View className="items-end">
                <Text className="text-white font-bold text-lg">{Math.round(score)}%</Text>
                <Text 
                  className="text-xs font-medium"
                  style={{ color: scoreLevel.color }}
                >
                  {scoreLevel.level}
                </Text>
              </View>
            </View>
            
            {/* Progress Bar */}
            <View className="mb-2">
              <ProgressBar 
                progress={score} 
                color={category.color} 
                height={6}
              />
            </View>
            
            {/* Score Breakdown */}
            <View className="flex-row justify-between text-xs">
              <Text className="text-white/40">0%</Text>
              <Text className="text-white/40">25%</Text>
              <Text className="text-white/40">50%</Text>
              <Text className="text-white/40">75%</Text>
              <Text className="text-white/40">100%</Text>
            </View>
          </View>
        );
      })}
      
      {/* Summary */}
      <View className="bg-white/10 rounded-xl p-4 mt-2">
        <Text className="text-white font-medium mb-2">Overall Assessment</Text>
        <View className="space-y-2">
          {(() => {
            const scores = Object.values(categoryScores);
            const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            const highestCategory = Object.entries(categoryScores).reduce((a, b) => 
              categoryScores[a[0] as keyof typeof categoryScores] > categoryScores[b[0] as keyof typeof categoryScores] ? a : b
            );
            const lowestCategory = Object.entries(categoryScores).reduce((a, b) => 
              categoryScores[a[0] as keyof typeof categoryScores] < categoryScores[b[0] as keyof typeof categoryScores] ? a : b
            );
            
            return (
              <>
                <View className="flex-row justify-between">
                  <Text className="text-white/70 text-sm">Average Score:</Text>
                  <Text className="text-white font-medium">{Math.round(avgScore)}%</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-white/70 text-sm">Strongest Area:</Text>
                  <Text className="text-white font-medium">
                    {CATEGORY_INFO[highestCategory[0] as keyof typeof CATEGORY_INFO].name}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-white/70 text-sm">Growth Area:</Text>
                  <Text className="text-white font-medium">
                    {CATEGORY_INFO[lowestCategory[0] as keyof typeof CATEGORY_INFO].name}
                  </Text>
                </View>
              </>
            );
          })()
          }
        </View>
      </View>
    </ScrollView>
  );
};