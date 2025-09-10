import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from "react-native-reanimated";

interface RecommendationCardProps {
  recommendation: string;
  index: number;
  accentColor: string;
}

const RECOMMENDATION_ICONS = [
  "compass-outline",
  "rocket-outline",
  "leaf-outline",
  "diamond-outline",
  "ribbon-outline"
];

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  index,
  accentColor
}) => {
  const slideIn = useSharedValue(30);
  const fadeIn = useSharedValue(0);
  const scaleValue = useSharedValue(1);
  
  React.useEffect(() => {
    slideIn.value = withDelay(
      index * 150,
      withSpring(0)
    );
    
    fadeIn.value = withDelay(
      index * 150,
      withSpring(1)
    );
  }, [index]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: slideIn.value },
      { scale: scaleValue.value }
    ],
    opacity: fadeIn.value
  }));

  const handlePress = () => {
    scaleValue.value = withSpring(0.98, {}, () => {
      scaleValue.value = withSpring(1);
    });
  };

  const iconName = RECOMMENDATION_ICONS[index % RECOMMENDATION_ICONS.length];

  return (
    <Animated.View style={animatedStyle}>
      <Pressable 
        onPress={handlePress}
        className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
      >
        <View className="flex-row items-start">
          <View 
            className="w-10 h-10 rounded-full items-center justify-center mr-3 mt-0.5"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <Ionicons name={iconName as any} size={20} color={accentColor} />
          </View>
          <View className="flex-1">
            <Text className="text-white font-medium mb-1">
              Recommendation #{index + 1}
            </Text>
            <Text className="text-white/80 leading-5">{recommendation}</Text>
          </View>
          <View className="ml-2">
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};