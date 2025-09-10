import React from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface ProgressBarProps {
  progress: number; // 0-100
  color: string;
  height?: number;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color,
  height = 8,
  animated = true
}) => {
  const progressWidth = useSharedValue(0);
  
  React.useEffect(() => {
    if (animated) {
      progressWidth.value = withSpring(progress, {
        damping: 15,
        stiffness: 100
      });
    } else {
      progressWidth.value = progress;
    }
  }, [progress]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`
  }));

  return (
    <View 
      className="bg-white/10 rounded-full overflow-hidden"
      style={{ height }}
    >
      <Animated.View 
        style={[animatedStyle, { 
          height: '100%',
          backgroundColor: color,
          borderRadius: height / 2
        }]}
      />
    </View>
  );
};