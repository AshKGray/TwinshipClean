import React, { useEffect, useState } from "react";
import { View, Text, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTwinStore } from "../../state/twinStore";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ProcessingAnimation } from "../../components/assessment/ProcessingAnimation";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from "react-native-reanimated";

interface AssessmentResults {
  overallScore: number;
  categoryScores: {
    emotionalConnection: number;
    telepathicExperiences: number;
    behavioralSynchrony: number;
    sharedExperiences: number;
    physicalSensations: number;
  };
  level: "Developing" | "Moderate" | "Strong" | "Extraordinary";
  insights: string[];
  recommendations: string[];
}

const PROCESSING_STEPS = [
  "Analyzing your responses...",
  "Calculating connection strength...",
  "Identifying patterns...",
  "Generating insights...",
  "Preparing recommendations...",
  "Finalizing your results..."
];

export const AssessmentLoadingScreen = () => {
  const { userProfile } = useTwinStore();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const responses = route.params?.responses || {};
  const themeColor = userProfile?.accentColor || "neon-purple";
  
  const getAccentColor = () => {
    switch (themeColor) {
      case "neon-pink": return "#ff1493";
      case "neon-blue": return "#00bfff";
      case "neon-green": return "#00ff7f";
      case "neon-yellow": return "#ffff00";
      case "neon-purple": return "#8a2be2";
      case "neon-orange": return "#ff4500";
      case "neon-cyan": return "#00ffff";
      case "neon-red": return "#ff0000";
      default: return "#8a2be2";
    }
  };

  const accentColor = getAccentColor();
  
  // Animation values
  const pulseScale = useSharedValue(1);
  const rotateValue = useSharedValue(0);
  
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }]
  }));
  
  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateValue.value}deg` }]
  }));

  // Calculate assessment results
  const calculateResults = (): AssessmentResults => {
    const responseValues = Object.values(responses) as number[];
    const averageScore = responseValues.reduce((sum, val) => sum + val, 0) / responseValues.length;
    const normalizedScore = (averageScore / 7) * 100;
    
    // Category-specific calculations (simplified)
    const categoryScores = {
      emotionalConnection: Math.min(100, normalizedScore + (Math.random() * 20 - 10)),
      telepathicExperiences: Math.min(100, normalizedScore + (Math.random() * 20 - 10)),
      behavioralSynchrony: Math.min(100, normalizedScore + (Math.random() * 20 - 10)),
      sharedExperiences: Math.min(100, normalizedScore + (Math.random() * 20 - 10)),
      physicalSensations: Math.min(100, normalizedScore + (Math.random() * 20 - 10)),
    };
    
    let level: "Developing" | "Moderate" | "Strong" | "Extraordinary";
    if (normalizedScore < 30) level = "Developing";
    else if (normalizedScore < 50) level = "Moderate";
    else if (normalizedScore < 75) level = "Strong";
    else level = "Extraordinary";
    
    const insights = [
      "Your twin connection shows unique patterns of synchronicity",
      "You demonstrate above-average emotional attunement",
      "Your telepathic experiences suggest a strong psychic bond"
    ];
    
    const recommendations = [
      "Practice daily meditation together to strengthen your connection",
      "Keep a shared journal of synchronistic events",
      "Try the telepathic communication exercises in our app"
    ];
    
    return {
      overallScore: Math.round(normalizedScore),
      categoryScores,
      level,
      insights,
      recommendations
    };
  };

  useEffect(() => {
    // Start animations
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
    
    rotateValue.value = withRepeat(
      withTiming(360, { duration: 3000 }),
      -1,
      false
    );
    
    // Progress through steps
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < PROCESSING_STEPS.length - 1) {
          setProgress(((prev + 1) / PROCESSING_STEPS.length) * 100);
          return prev + 1;
        }
        return prev;
      });
    }, 1000);
    
    // Navigate to results after processing
    const resultsTimeout = setTimeout(() => {
      const results = calculateResults();
      navigation.replace("AssessmentResults" as never, { results });
    }, PROCESSING_STEPS.length * 1000 + 1000);
    
    return () => {
      clearInterval(stepInterval);
      clearTimeout(resultsTimeout);
    };
  }, []);

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 justify-center items-center">
          {/* Processing Icon */}
          <Animated.View 
            style={[pulseStyle]}
            className="mb-8"
          >
            <Animated.View 
              style={[rotateStyle]}
              className="w-24 h-24 rounded-full items-center justify-center"
              backgroundColor={`${accentColor}30`}
            >
              <Ionicons name="analytics" size={48} color={accentColor} />
            </Animated.View>
          </Animated.View>

          {/* Processing Text */}
          <View className="items-center mb-8">
            <Text className="text-white text-2xl font-bold mb-2">
              Processing Your Results
            </Text>
            <Text className="text-white/70 text-center">
              Analyzing your twin connection patterns
            </Text>
          </View>

          {/* Progress Bar */}
          <View className="w-full max-w-sm mb-8">
            <View className="bg-white/10 rounded-full h-2 overflow-hidden">
              <View 
                className="h-full rounded-full transition-all duration-300"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: accentColor 
                }}
              />
            </View>
            <Text className="text-white/70 text-center text-sm mt-2">
              {Math.round(progress)}% complete
            </Text>
          </View>

          {/* Current Step */}
          <View className="bg-white/10 backdrop-blur-sm rounded-xl p-4 w-full max-w-sm">
            <View className="flex-row items-center">
              <View 
                className="w-3 h-3 rounded-full mr-3"
                style={{ backgroundColor: accentColor }}
              />
              <Text className="text-white text-sm">
                {PROCESSING_STEPS[currentStep]}
              </Text>
            </View>
          </View>

          {/* Processing Animation */}
          <View className="mt-8">
            <ProcessingAnimation color={accentColor} />
          </View>

          {/* Fun Facts */}
          <View className="mt-8 bg-white/5 rounded-xl p-4 w-full max-w-sm">
            <Text className="text-white/70 text-xs text-center">
              💫 Did you know? Identical twins share 99.9% of their DNA, which may contribute to their psychic connection
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};