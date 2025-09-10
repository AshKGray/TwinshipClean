import React from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface LikertScaleProps {
  labels: string[];
  selectedValue?: number;
  onSelect: (value: number) => void;
  accentColor: string;
}

export const LikertScale: React.FC<LikertScaleProps> = ({
  labels,
  selectedValue,
  onSelect,
  accentColor
}) => {
  const scaleValue = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }]
  }));

  const handlePress = (value: number) => {
    scaleValue.value = withSpring(0.95, {}, () => {
      scaleValue.value = withSpring(1);
    });
    onSelect(value);
  };

  return (
    <View className="space-y-4">
      {/* Scale Numbers */}
      <View className="flex-row justify-between px-2">
        {labels.map((_, index) => {
          const value = index + 1;
          const isSelected = selectedValue === value;
          
          return (
            <Animated.View key={value} style={isSelected ? animatedStyle : {}}>
              <Pressable
                onPress={() => handlePress(value)}
                className={`w-12 h-12 rounded-full items-center justify-center border-2 ${
                  isSelected ? '' : 'border-white/30'
                }`}
                style={isSelected ? { 
                  backgroundColor: accentColor,
                  borderColor: accentColor
                } : {}}
              >
                <Text className={`font-bold ${
                  isSelected ? 'text-white' : 'text-white/70'
                }`}>
                  {value}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Scale Labels */}
      <View className="flex-row justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-white/60 text-xs text-left">
            {labels[0]}
          </Text>
        </View>
        
        <View className="flex-1 px-1">
          <Text className="text-white/60 text-xs text-center">
            {labels[Math.floor(labels.length / 2)]}
          </Text>
        </View>
        
        <View className="flex-1 pl-2">
          <Text className="text-white/60 text-xs text-right">
            {labels[labels.length - 1]}
          </Text>
        </View>
      </View>

      {/* Selected Label Display */}
      {selectedValue && (
        <View className="mt-4">
          <View 
            className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 self-center"
          >
            <Text className="text-white font-medium text-center">
              {labels[selectedValue - 1]}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};