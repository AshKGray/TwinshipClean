import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from "react-native-reanimated";

interface InsightCardProps {
  insight: string;
  index: number;
  accentColor: string;
}

const INSIGHT_ICONS = [
  "bulb-outline",
  "eye-outline",
  "heart-outline",
  "flash-outline",
  "star-outline"
];

export const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  index,
  accentColor
}) => {
  const slideIn = useSharedValue(50);
  const fadeIn = useSharedValue(0);
  
  React.useEffect(() => {
    slideIn.value = withDelay(
      index * 200,
      withSpring(0, {
        damping: 15,
        stiffness: 100
      })
    );
    
    fadeIn.value = withDelay(
      index * 200,
      withSpring(1)
    );
  }, [index]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideIn.value }],
    opacity: fadeIn.value
  }));

  const iconName = INSIGHT_ICONS[index % INSIGHT_ICONS.length];

  return (
    <Animated.View 
      style={animatedStyle}
      className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
    >
      <View className="flex-row items-start">
        <View 
          className="w-8 h-8 rounded-full items-center justify-center mr-3 mt-0.5"
          style={{ backgroundColor: `${accentColor}30` }}
        >
          <Ionicons name={iconName as any} size={16} color={accentColor} />
        </View>
        <View className="flex-1">
          <Text className="text-white/90 leading-5">{insight}</Text>
        </View>
      </View>
    </Animated.View>
  );
};