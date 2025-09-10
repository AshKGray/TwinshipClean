import React from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  progress: number; // 0-100
  size: number;
  color: string;
  strokeWidth?: number;
  showPercentage?: boolean;
  backgroundColor?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size,
  color,
  strokeWidth = 8,
  showPercentage = false,
  backgroundColor = "rgba(255, 255, 255, 0.1)"
}) => {
  const animatedProgress = useSharedValue(0);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  React.useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 1500,
      easing: Easing.out(Easing.cubic)
    });
  }, [progress]);
  
  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - (animatedProgress.value / 100) * circumference;
    return {
      strokeDashoffset
    };
  });

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size} className="absolute">
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress Circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          animatedProps={animatedProps}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      
      {showPercentage && (
        <View className="absolute items-center justify-center">
          <Text className="text-white text-2xl font-bold">{Math.round(progress)}%</Text>
        </View>
      )}
    </View>
  );
};