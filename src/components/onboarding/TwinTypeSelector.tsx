import React, { useRef, useEffect } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { TwinType } from "../../state/twinStore";

interface TwinTypeData {
  type: TwinType;
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  features: string[];
}

interface TwinTypeSelectorProps {
  twinType: TwinTypeData;
  isSelected: boolean;
  onSelect: (type: TwinType) => void;
  showDetails: boolean;
}

export const TwinTypeSelector: React.FC<TwinTypeSelectorProps> = ({
  twinType,
  isSelected,
  onSelect,
  showDetails,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showDetails) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(heightAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(heightAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [showDetails]);

  const getTypeColor = (type: TwinType): string => {
    switch (type) {
      case 'identical':
        return '#ff69b4'; // Pink for identical
      case 'fraternal':
        return '#00bfff'; // Blue for fraternal  
      case 'other':
        return '#9370db'; // Purple for other
      default:
        return '#ffffff';
    }
  };

  const typeColor = getTypeColor(twinType.type);

  return (
    <Pressable
      onPress={() => onSelect(twinType.type)}
      className={`rounded-2xl border-2 overflow-hidden ${
        isSelected 
          ? 'bg-white/15 border-white/40' 
          : 'bg-white/5 border-white/20'
      }`}
      style={({ pressed }) => ({
        opacity: pressed ? 0.8 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <LinearGradient
        colors={isSelected 
          ? ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']
          : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
        }
        className="p-6"
      >
        <View className="flex-row items-center">
          {/* Selection Radio */}
          <View className={`w-6 h-6 rounded-full border-2 mr-4 items-center justify-center ${
            isSelected ? 'border-white/70' : 'border-white/30'
          }`}>
            {isSelected && (
              <View 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: typeColor }}
              />
            )}
          </View>

          {/* Icon */}
          <View 
            className="w-12 h-12 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: `${typeColor}20` }}
          >
            <Ionicons 
              name={twinType.icon} 
              size={24} 
              color={typeColor}
            />
          </View>

          {/* Content */}
          <View className="flex-1">
            <Text className="text-white text-xl font-semibold mb-1">
              {twinType.title}
            </Text>
            <Text className="text-white/60 text-sm">
              {twinType.subtitle}
            </Text>
          </View>

          {/* Expand Indicator */}
          <Ionicons 
            name={showDetails ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="rgba(255,255,255,0.4)" 
          />
        </View>

        {/* Expandable Details */}
        <Animated.View
          style={{
            height: heightAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 200], // Adjust based on content
            }),
            opacity: slideAnim,
          }}
        >
          <View className="mt-6 pt-6 border-t border-white/10">
            <Text className="text-white/80 text-base mb-4 leading-6">
              {twinType.description}
            </Text>

            <Text className="text-white text-sm font-semibold mb-3">
              Key Characteristics:
            </Text>

            <View className="space-y-2">
              {twinType.features.map((feature, index) => (
                <View key={index} className="flex-row items-center">
                  <View 
                    className="w-1.5 h-1.5 rounded-full mr-3" 
                    style={{ backgroundColor: typeColor }}
                  />
                  <Text className="text-white/70 text-sm flex-1">
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            {/* Scientific Note */}
            <View className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <Text className="text-white/60 text-xs leading-5">
                {twinType.type === 'identical' && 
                  "Research shows identical twins may have heightened synchronicity and shared sensory experiences."
                }
                {twinType.type === 'fraternal' && 
                  "Studies indicate fraternal twins develop unique complementary strengths and perspectives."
                }
                {twinType.type === 'other' && 
                  "All twin relationships create profound psychological and emotional bonds regardless of biology."
                }
              </Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>
    </Pressable>
  );
};