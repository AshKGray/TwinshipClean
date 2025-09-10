import React, { useRef, useEffect } from "react";
import { View, Text, Pressable, Animated, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ThemeColor } from "../../state/twinStore";
import { getNeonAccentColor, getNeonGradientColors } from "../../utils/neonColors";

const { width } = Dimensions.get('window');

interface ColorOption {
  color: ThemeColor;
  name: string;
  description: string;
}

interface ColorPickerProps {
  colors: ColorOption[];
  selectedColor: ThemeColor;
  onColorSelect: (color: ThemeColor) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  colors,
  selectedColor,
  onColorSelect,
}) => {
  const animatedValues = useRef(
    colors.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Animate colors in sequence
    const animations = animatedValues.map((value, index) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 200,
        delay: index * 100,
        useNativeDriver: true,
      })
    );

    Animated.stagger(50, animations).start();
  }, []);

  const ColorOption: React.FC<{
    colorOption: ColorOption;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
  }> = ({ colorOption, index, isSelected, onSelect }) => {
    const accentColor = getNeonAccentColor(colorOption.color);
    const gradientColors = getNeonGradientColors(colorOption.color);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={{
          opacity: animatedValues[index],
          transform: [
            { 
              scale: animatedValues[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              })
            },
            { scale: scaleAnim }
          ],
        }}
        className="flex-1 mx-1"
      >
        <Pressable
          onPress={onSelect}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          className={`items-center p-3 rounded-2xl border-2 ${
            isSelected 
              ? 'bg-white/15 border-white/50' 
              : 'bg-white/5 border-white/20'
          }`}
        >
          {/* Color Circle with Gradient */}
          <View className="relative mb-3">
            <LinearGradient
              colors={gradientColors}
              className="w-12 h-12 rounded-full items-center justify-center"
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isSelected && (
                <Ionicons name="checkmark" size={20} color="white" />
              )}
            </LinearGradient>
            
            {/* Glow effect for selected */}
            {isSelected && (
              <>
                <View 
                  className="absolute inset-0 w-12 h-12 rounded-full opacity-50"
                  style={{ 
                    backgroundColor: accentColor,
                    shadowColor: accentColor,
                    shadowOpacity: 0.8,
                    shadowRadius: 10,
                    elevation: 10,
                  }}
                />
                <View 
                  className="absolute -inset-1 w-14 h-14 rounded-full border opacity-60"
                  style={{ borderColor: accentColor }}
                />
              </>
            )}
          </View>

          {/* Color Name */}
          <Text className={`text-xs font-medium text-center ${
            isSelected ? 'text-white' : 'text-white/70'
          }`}>
            {colorOption.name.split(' ')[1]} {/* Show just the color name */}
          </Text>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View>
      <Text className="text-white text-lg font-semibold text-center mb-6">
        Choose Your Color
      </Text>
      
      {/* Color Grid */}
      <View className="flex-row flex-wrap justify-center">
        {/* First row - 4 colors */}
        <View className="flex-row w-full mb-4">
          {colors.slice(0, 4).map((color, index) => (
            <ColorOption
              key={color.color}
              colorOption={color}
              index={index}
              isSelected={selectedColor === color.color}
              onSelect={() => onColorSelect(color.color)}
            />
          ))}
        </View>
        
        {/* Second row - 4 colors */}
        <View className="flex-row w-full">
          {colors.slice(4, 8).map((color, index) => (
            <ColorOption
              key={color.color}
              colorOption={color}
              index={index + 4}
              isSelected={selectedColor === color.color}
              onSelect={() => onColorSelect(color.color)}
            />
          ))}
        </View>
      </View>

      {/* Color Harmony Note */}
      <View className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
        <View className="flex-row items-center justify-center mb-2">
          <Ionicons name="color-palette" size={16} color="rgba(255,255,255,0.6)" />
          <Text className="text-white/60 text-sm ml-2 font-medium">
            Color Harmony
          </Text>
        </View>
        <Text className="text-white/50 text-xs text-center leading-5">
          Each color reflects different aspects of your personality. 
          Choose the one that feels most like you.
        </Text>
      </View>
    </View>
  );
};