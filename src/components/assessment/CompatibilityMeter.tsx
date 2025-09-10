import React from "react";
import { View, Text } from "react-native";
import { CircularProgress } from "./CircularProgress";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from "react-native-reanimated";

interface CompatibilityMeterProps {
  score: number; // 0-100
  color: string;
  size?: number;
  showPercentage?: boolean;
  showLevel?: boolean;
}

const getCompatibilityLevel = (score: number) => {
  if (score >= 90) return { level: "Soul Mates", color: "#ec4899", icon: "heart" };
  if (score >= 80) return { level: "Exceptional", color: "#8b5cf6", icon: "star" };
  if (score >= 70) return { level: "Strong", color: "#3b82f6", icon: "trending-up" };
  if (score >= 60) return { level: "Good", color: "#10b981", icon: "thumbs-up" };
  if (score >= 40) return { level: "Developing", color: "#f59e0b", icon: "build" };
  return { level: "Emerging", color: "#ef4444", icon: "flower" };
};

export const CompatibilityMeter: React.FC<CompatibilityMeterProps> = ({
  score,
  color,
  size = 100,
  showPercentage = false,
  showLevel = true
}) => {
  const compatibility = getCompatibilityLevel(score);
  
  const fadeIn = useSharedValue(0);
  const scaleIn = useSharedValue(0.5);
  
  React.useEffect(() => {
    fadeIn.value = withDelay(200, withSpring(1));
    scaleIn.value = withDelay(200, withSpring(1));
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ scale: scaleIn.value }]
  }));

  return (
    <Animated.View style={animatedStyle} className="items-center">
      <View className="relative">
        <CircularProgress 
          progress={score}
          size={size}
          color={compatibility.color}
          strokeWidth={size > 100 ? 10 : 6}
          showPercentage={showPercentage}
        />
        
        {!showPercentage && (
          <View className="absolute inset-0 items-center justify-center">
            <Ionicons 
              name={compatibility.icon as any} 
              size={size * 0.25} 
              color={compatibility.color} 
            />
          </View>
        )}
      </View>
      
      {showLevel && (
        <View className="items-center mt-3">
          <Text 
            className="font-bold text-lg"
            style={{ color: compatibility.color }}
          >
            {compatibility.level}
          </Text>
          <Text className="text-white/60 text-sm">
            {Math.round(score)}% Compatible
          </Text>
        </View>
      )}
    </Animated.View>
  );
};