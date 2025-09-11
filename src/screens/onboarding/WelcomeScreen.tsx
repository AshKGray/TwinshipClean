import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, Dimensions, Image, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

interface WelcomeScreenProps {
  onContinue: () => void;
}

const { width, height } = Dimensions.get('window');

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const titleAnim = useRef(new Animated.Value(50)).current;
  const subtitleAnim = useRef(new Animated.Value(30)).current;
  const buttonAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(titleAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]);
    
    sequence.start();
  }, []);

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <View className="flex-1 justify-center items-center px-8">
          {/* Twinship Logo */}
          <Animated.View 
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }}
            className="mb-12"
          >
            <Image 
              source={require('../../../assets/twinshipAppIcon.png')}
              style={{ width: 200, height: 200 }}
              resizeMode="contain"
            />
          </Animated.View>


          {/* Continue Button with tagline */}
          <Animated.View 
            style={{ 
              transform: [{ translateY: buttonAnim }] 
            }}
            className="w-full"
          >
            <Pressable
              onPress={onContinue}
              className="bg-black/80 backdrop-blur-sm rounded-full py-4 items-center mx-8 border border-white/30"
              style={({ pressed }) => ([
                {
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                }
              ])}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                className="absolute inset-0 rounded-full"
              />
              <Text className="text-white text-lg font-semibold tracking-wide">
                To twinfinity...and beyond!
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};