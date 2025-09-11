import React, { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Animated, Dimensions, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ColorPicker } from "../../components/onboarding/ColorPicker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTwinStore, ThemeColor } from "../../state/twinStore";
import { getNeonAccentColor, getNeonGradientColors } from "../../utils/neonColors";

interface ColorSelectionScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

const { width } = Dimensions.get('window');

export const ColorSelectionScreen: React.FC<ColorSelectionScreenProps> = ({ 
  onContinue, 
  onBack 
}) => {
  const { userProfile, setUserProfile } = useTwinStore();
  const [selectedColor, setSelectedColor] = useState<ThemeColor>(
    userProfile?.accentColor || "neon-purple"
  );
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const previewAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(previewAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Gentle pulse animation for selected color
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  const handleContinue = () => {
    if (!userProfile) return;

    setUserProfile({
      ...userProfile,
      accentColor: selectedColor,
    });
    onContinue();
  };

  const neonColors: { color: ThemeColor; name: string; description: string }[] = [
    { color: "neon-pink", name: "Hot Pink", description: "Intuitive & Emotional" },
    { color: "neon-blue", name: "Electric Blue", description: "Calm & Analytical" },
    { color: "neon-green", name: "Bright Green", description: "Balanced & Growth" },
    { color: "neon-yellow", name: "Neon Yellow", description: "Energetic & Creative" },
    { color: "neon-purple", name: "Vibrant Purple", description: "Creative & Wise" },
    { color: "neon-orange", name: "Bright Orange", description: "Bold & Passionate" },
    { color: "neon-cyan", name: "Electric Cyan", description: "Clear & Focused" },
    { color: "neon-red", name: "Bright Red", description: "Strong & Determined" },
  ];

  const renderPreviewElements = () => {
    const accentColor = getNeonAccentColor(selectedColor);
    const gradientColors = getNeonGradientColors(selectedColor);

    return (
      <View className="items-center space-y-4">
        {/* Chat Bubble Preview */}
        <View className="flex-row justify-end w-full max-w-sm">
          <View 
            className="px-4 py-3 rounded-2xl rounded-br-sm max-w-xs"
            style={{ backgroundColor: accentColor + '40' }}
          >
            <Text className="text-white text-sm">
              Hey twin! Love this color! 💫
            </Text>
          </View>
        </View>

        {/* Button Preview */}
        <Pressable
          className="px-8 py-3 rounded-full border-2"
          style={{
            backgroundColor: accentColor + '30',
            borderColor: accentColor + '60',
          }}
        >
          <Text className="text-white font-semibold">
            Sample Button
          </Text>
        </Pressable>

        {/* Accent Elements */}
        <View className="flex-row space-x-3">
          {gradientColors.map((color, index) => (
            <View
              key={index}
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: color + '80' }}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between pt-4 pb-8 px-8">
            <Pressable
              onPress={onBack}
              className="w-10 h-10 rounded-full bg-black/80 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={20} color="white" />
            </Pressable>
            
            <View className="flex-1 items-center">
              <Text className="text-white/60 text-sm">Step 4 of 5</Text>
              <View className="flex-row mt-2 space-x-1">
                {[...Array(5)].map((_, i) => (
                  <View 
                    key={i} 
                    className={`h-1 w-8 rounded-full ${
                      i <= 3 ? 'bg-white' : 'bg-black/80'
                    }`} 
                  />
                ))}
              </View>
            </View>
            
            <View className="w-10" />
          </View>

          <ScrollView className="flex-1 px-8" showsVerticalScrollIndicator={false}>
            <Animated.View style={{ opacity: fadeAnim }}>
              {/* Color Symbol */}
              <Animated.View 
                style={{ 
                  transform: [{ scale: pulseAnim }]
                }}
                className="items-center mb-8"
              >
                <View className="relative">
                  <View 
                    className="w-20 h-20 rounded-full border-4 items-center justify-center"
                    style={{ 
                      borderColor: getNeonAccentColor(selectedColor) + '60',
                      backgroundColor: getNeonAccentColor(selectedColor) + '20'
                    }}
                  >
                    <Ionicons 
                      name="color-palette" 
                      size={32} 
                      color={getNeonAccentColor(selectedColor)} 
                    />
                  </View>
                  <View 
                    className="absolute -inset-1 w-22 h-22 rounded-full border"
                    style={{ borderColor: getNeonAccentColor(selectedColor) + '30' }}
                  />
                </View>
              </Animated.View>

              <Text className="text-white text-3xl font-bold text-center mb-4">
                Your Color Theme
              </Text>
              
              <Text className="text-white/70 text-base text-center mb-12 leading-6">
                Choose a neon color you like. This will personalize your chat bubbles, buttons, and accents throughout the app.
              </Text>

              {/* Live Preview */}
              <Animated.View 
                style={{ transform: [{ scale: previewAnim }] }}
                className="bg-black/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20"
              >
                <Text className="text-white text-lg font-semibold text-center mb-4">
                  Live Preview
                </Text>
                {renderPreviewElements()}
              </Animated.View>

              {/* Color Palette */}
              <ColorPicker
                colors={neonColors}
                selectedColor={selectedColor}
                onColorSelect={setSelectedColor}
              />

              {/* Color Meaning */}
              <View className="bg-black/70 rounded-xl p-6 mt-8 mb-8 border border-white/10">
                <View className="flex-row items-center mb-3">
                  <View 
                    className="w-6 h-6 rounded-full mr-3"
                    style={{ backgroundColor: getNeonAccentColor(selectedColor) }}
                  />
                  <Text className="text-white text-lg font-semibold">
                    {neonColors.find(c => c.color === selectedColor)?.name}
                  </Text>
                </View>
                <Text className="text-white/70 text-base">
                  {neonColors.find(c => c.color === selectedColor)?.description}
                </Text>
              </View>

              {/* Color Note */}
              <View className="bg-black/70 rounded-xl p-6 mb-8 border border-white/10">
                <View className="flex-row items-start">
                  <Ionicons name="sparkles" size={20} color="#ffd700" className="mr-3 mt-1" />
                  <View className="flex-1">
                    <Text className="text-white text-base font-medium mb-2">
                      Color & You
                    </Text>
                    <Text className="text-white/60 text-sm leading-6">
                      Your chosen color will appear throughout the app to personalize your experience. Your twin will see this color in your messages and profile, making it easy to recognize your content.
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </ScrollView>

          {/* Continue Button */}
          <View className="px-8 pb-8">
            <Pressable
              onPress={handleContinue}
              className="rounded-full py-4 items-center border-2"
              style={{
                backgroundColor: getNeonAccentColor(selectedColor) + '30',
                borderColor: getNeonAccentColor(selectedColor) + '60',
              }}
              android_ripple={{
                color: getNeonAccentColor(selectedColor) + '40',
                borderless: false
              }}
            >
              <LinearGradient
                colors={[
                  getNeonAccentColor(selectedColor) + '40',
                  getNeonAccentColor(selectedColor) + '20'
                ]}
                className="absolute inset-0 rounded-full"
              />
              <Text className="text-white text-lg font-semibold">
                Continue with {neonColors.find(c => c.color === selectedColor)?.name}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};