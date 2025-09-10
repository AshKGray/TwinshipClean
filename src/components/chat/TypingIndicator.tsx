import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { TypingIndicator as TypingIndicatorType } from '../../types/chat';
import { useTwinStore } from '../../state/twinStore';
import { getNeonAccentColor } from '../../utils/neonColors';

interface TypingIndicatorProps {
  typingIndicator: TypingIndicatorType;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingIndicator }) => {
  const twinProfile = useTwinStore((state) => state.twinProfile);
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const accentColor = twinProfile?.accentColor || 'neon-purple';
  const neonColor = getNeonAccentColor(accentColor);

  useEffect(() => {
    // Slide in animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Pulsing dots animation
    const createPulseAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 600,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const dot1Animation = createPulseAnimation(dot1Anim, 0);
    const dot2Animation = createPulseAnimation(dot2Anim, 200);
    const dot3Animation = createPulseAnimation(dot3Anim, 400);

    dot1Animation.start();
    dot2Animation.start();
    dot3Animation.start();

    return () => {
      dot1Animation.stop();
      dot2Animation.stop();
      dot3Animation.stop();
    };
  }, []);

  return (
    <Animated.View
      style={{
        transform: [{ translateX: slideAnim }],
      }}
      className="items-start mb-4"
    >
      <View
        style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderColor: neonColor,
          borderWidth: 1,
        }}
        className="rounded-2xl rounded-bl-md px-4 py-3 min-w-[80px]"
      >
        <View className="flex-row items-center justify-center space-x-1">
          <Animated.View
            style={{
              opacity: dot1Anim,
              backgroundColor: neonColor,
            }}
            className="w-2 h-2 rounded-full"
          />
          <Animated.View
            style={{
              opacity: dot2Anim,
              backgroundColor: neonColor,
            }}
            className="w-2 h-2 rounded-full"
          />
          <Animated.View
            style={{
              opacity: dot3Anim,
              backgroundColor: neonColor,
            }}
            className="w-2 h-2 rounded-full"
          />
        </View>
      </View>
      <Text className="text-white/50 text-xs mt-1 ml-1">
        {typingIndicator.userName} is typing...
      </Text>
    </Animated.View>
  );
};
