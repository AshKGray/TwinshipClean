import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTwinStore } from "../../state/twinStore";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { RecommendationCard } from "../../components/assessment/RecommendationCard";
import { MicroExperimentCard } from "../../components/assessment/MicroExperimentCard";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
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

const COACHING_PLANS = {
  "Developing": {
    title: "Foundation Builder Plan",
    duration: "2-4 weeks",
    focus: "Building basic twin connection awareness",
    activities: [
      "Daily 5-minute meditation together",
      "Weekly twin journaling sessions",
      "Basic telepathy exercises",
      "Emotional check-ins twice daily"
    ]
  },
  "Moderate": {
    title: "Connection Enhancer Plan",
    duration: "4-6 weeks",
    focus: "Strengthening existing intuitive abilities",
    activities: [
      "Advanced meditation techniques",
      "Dream sharing and analysis",
      "Telepathic communication practice",
      "Energy healing exercises"
    ]
  },
  "Strong": {
    title: "Mastery Development Plan",
    duration: "6-8 weeks",
    focus: "Refining and expanding intuitive abilities",
    activities: [
      "Complex telepathy challenges",
      "Remote viewing exercises",
      "Intuitive healing practices",
      "Advanced synchronicity work"
    ]
  },
  "Extraordinary": {
    title: "Transcendence Program",
    duration: "8+ weeks",
    focus: "Exploring the depths of twin consciousness",
    activities: [
      "Consciousness merging techniques",
      "Advanced astral projection",
      "Intuitive research participation",
      "Mentoring other twin pairs"
    ]
  }
};

const MICRO_EXPERIMENTS = [
  {
    id: 1,
    title: "Emotion Mirror",
    description: "Try to sense your twin's current emotional state, then check with them",
    duration: "2 minutes",
    difficulty: "Easy",
    category: "Emotional Connection"
  },
  {
    id: 2,
    title: "Color Transmission",
    description: "One twin thinks of a color, the other tries to receive it telepathically",
    duration: "5 minutes",
    difficulty: "Medium",
    category: "Telepathic Experiences"
  },
  {
    id: 3,
    title: "Synchronous Breathing",
    description: "Breathe together in perfect synchrony for 10 minutes, even when apart",
    duration: "10 minutes",
    difficulty: "Easy",
    category: "Behavioral Synchrony"
  },
  {
    id: 4,
    title: "Dream Connection",
    description: "Try to visit each other's dreams or share the same dream",
    duration: "1 night",
    difficulty: "Hard",
    category: "Shared Experiences"
  },
  {
    id: 5,
    title: "Energy Touch",
    description: "Send healing energy to your twin when they're feeling unwell",
    duration: "15 minutes",
    difficulty: "Medium",
    category: "Physical Sensations"
  },
  {
    id: 6,
    title: "Thought Transmission",
    description: "Send a specific word or phrase to your twin telepathically",
    duration: "3 minutes",
    difficulty: "Medium",
    category: "Telepathic Experiences"
  }
];

export const AssessmentRecommendationsScreen = () => {
  const { userProfile } = useTwinStore();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [selectedTab, setSelectedTab] = useState<'plan' | 'exercises' | 'tips'>('plan');
  const [completedExperiments, setCompletedExperiments] = useState<number[]>([]);
  
  const results: AssessmentResults = route.params?.results;
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
  const coachingPlan = COACHING_PLANS[results?.level];
  
  // Animation
  const fadeIn = useSharedValue(0);
  
  React.useEffect(() => {
    fadeIn.value = withSpring(1);
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value
  }));

  const handleExperimentComplete = (experimentId: number) => {
    setCompletedExperiments(prev => [...prev, experimentId]);
    Alert.alert(
      "Experiment Completed! 🎉",
      "Great job! Keep practicing to strengthen your twin connection.",
      [{ text: "Continue", style: "default" }]
    );
  };

  const handleStartPlan = () => {
    Alert.alert(
      "Start Coaching Plan",
      `Ready to begin your ${coachingPlan?.title}? This will help you develop your twin connection over the next ${coachingPlan?.duration}.`,
      [
        { text: "Maybe Later", style: "cancel" },
        { 
          text: "Start Now", 
          style: "default",
          onPress: () => {
            // Here you would integrate with a coaching system
            Alert.alert("Plan Started!", "Your coaching plan has been activated. Check back daily for new activities.");
          }
        }
      ]
    );
  };

  const renderCoachingPlan = () => (
    <Animated.View style={animatedStyle} className="space-y-6">
      {/* Plan Overview */}
      <View className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
        <View className="flex-row items-center mb-4">
          <View 
            className="w-12 h-12 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: `${accentColor}30` }}
          >
            <Ionicons name="trophy" size={24} color={accentColor} />
          </View>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">{coachingPlan?.title}</Text>
            <Text className="text-white/70">{coachingPlan?.duration}</Text>
          </View>
        </View>
        
        <Text className="text-white/80 mb-4">{coachingPlan?.focus}</Text>
        
        <Pressable
          onPress={handleStartPlan}
          className="rounded-xl py-3 px-4"
          style={{ backgroundColor: accentColor }}
        >
          <Text className="text-white font-semibold text-center">Start This Plan</Text>
        </Pressable>
      </View>

      {/* Plan Activities */}
      <View className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
        <Text className="text-white font-semibold mb-4">Included Activities</Text>
        <View className="space-y-3">
          {coachingPlan?.activities.map((activity, index) => (
            <View key={index} className="flex-row items-center">
              <View 
                className="w-2 h-2 rounded-full mr-3"
                style={{ backgroundColor: accentColor }}
              />
              <Text className="text-white/80 flex-1">{activity}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Progress Tracking */}
      <View className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
        <Text className="text-white font-semibold mb-2">Track Your Progress</Text>
        <Text className="text-white/70 text-sm mb-4">
          Complete daily check-ins to monitor your twin connection growth
        </Text>
        <View className="flex-row space-x-3">
          <Pressable className="flex-1 bg-white/10 rounded-lg py-3">
            <Text className="text-white text-center text-sm">Daily Check-in</Text>
          </Pressable>
          <Pressable className="flex-1 bg-white/10 rounded-lg py-3">
            <Text className="text-white text-center text-sm">View Progress</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );

  const renderMicroExperiments = () => (
    <Animated.View style={animatedStyle} className="space-y-4">
      <View className="mb-2">
        <Text className="text-white text-lg font-semibold mb-2">Quick Experiments</Text>
        <Text className="text-white/70 text-sm">
          Try these bite-sized exercises to strengthen your connection
        </Text>
      </View>
      
      {MICRO_EXPERIMENTS.map((experiment) => (
        <MicroExperimentCard
          key={experiment.id}
          experiment={experiment}
          isCompleted={completedExperiments.includes(experiment.id)}
          onComplete={() => handleExperimentComplete(experiment.id)}
          accentColor={accentColor}
        />
      ))}
    </Animated.View>
  );

  const renderTips = () => (
    <Animated.View style={animatedStyle} className="space-y-4">
      <Text className="text-white text-lg font-semibold mb-2">Personalized Tips</Text>
      
      {results?.recommendations.map((recommendation, index) => (
        <RecommendationCard
          key={index}
          recommendation={recommendation}
          index={index}
          accentColor={accentColor}
        />
      ))}
      
      {/* General Tips */}
      <View className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
        <Text className="text-white font-semibold mb-3">General Guidelines</Text>
        <View className="space-y-2">
          {[
            "Practice regularly - consistency is key for developing intuitive abilities",
            "Stay relaxed and open-minded during experiments",
            "Keep a journal to track your experiences and progress",
            "Trust your intuition, even if it seems unlikely",
            "Be patient - intuitive abilities develop over time"
          ].map((tip, index) => (
            <View key={index} className="flex-row items-start">
              <Text className="text-white/70 mr-2">•</Text>
              <Text className="text-white/70 text-sm flex-1">{tip}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={28} color="white" />
            </Pressable>
            
            <Text className="text-white text-xl font-bold">Your Action Plan</Text>
            
            <View className="w-7" />
          </View>
          
          {/* Tab Navigation */}
          <View className="flex-row bg-white/10 rounded-xl p-1">
            {[
              { key: 'plan', label: 'Coaching' },
              { key: 'exercises', label: 'Exercises' },
              { key: 'tips', label: 'Tips' }
            ].map(tab => (
              <Pressable
                key={tab.key}
                onPress={() => setSelectedTab(tab.key as any)}
                className={`flex-1 py-2 px-3 rounded-lg ${
                  selectedTab === tab.key ? 'opacity-100' : 'opacity-70'
                }`}
                style={selectedTab === tab.key ? { backgroundColor: `${accentColor}40` } : {}}
              >
                <Text className="text-white text-center font-medium text-sm">
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <ScrollView className="flex-1 px-6">
          {selectedTab === 'plan' && renderCoachingPlan()}
          {selectedTab === 'exercises' && renderMicroExperiments()}
          {selectedTab === 'tips' && renderTips()}
          
          <View className="h-6" />
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};