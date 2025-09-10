import React from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";

interface ProcessingAnimationProps {
  color: string;
  size?: number;
}

export const ProcessingAnimation: React.FC<ProcessingAnimationProps> = ({
  color,
  size = 8
}) => {
  const dot1Scale = useSharedValue(0.5);
  const dot2Scale = useSharedValue(0.5);
  const dot3Scale = useSharedValue(0.5);
  
  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);

  React.useEffect(() => {
    // Dot 1 animation
    dot1Scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.5, { duration: 600 })
      ),
      -1,
      true
    );
    
    dot1Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.3, { duration: 600 })
      ),
      -1,
      true
    );

    // Dot 2 animation (delayed)
    dot2Scale.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.5, { duration: 600 })
        ),
        -1,
        true
      )
    );
    
    dot2Opacity.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.3, { duration: 600 })
        ),
        -1,
        true
      )
    );

    // Dot 3 animation (more delayed)
    dot3Scale.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.5, { duration: 600 })
        ),
        -1,
        true
      )
    );
    
    dot3Opacity.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.3, { duration: 600 })
        ),
        -1,
        true
      )
    );
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot1Scale.value }],
    opacity: dot1Opacity.value,
  }));

  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot2Scale.value }],
    opacity: dot2Opacity.value,
  }));

  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot3Scale.value }],
    opacity: dot3Opacity.value,
  }));

  return (
    <View className="flex-row items-center justify-center space-x-2">
      <Animated.View 
        style={[dot1Style, {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color
        }]}
      />
      <Animated.View 
        style={[dot2Style, {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color
        }]}
      />
      <Animated.View 
        style={[dot3Style, {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color
        }]}
      />
    </View>
  );
};