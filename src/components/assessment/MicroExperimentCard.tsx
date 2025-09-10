import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface MicroExperiment {
  id: number;
  title: string;
  description: string;
  duration: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
}

interface MicroExperimentCardProps {
  experiment: MicroExperiment;
  isCompleted: boolean;
  onComplete: () => void;
  accentColor: string;
}

const DIFFICULTY_COLORS = {
  "Easy": "#10b981",
  "Medium": "#f59e0b", 
  "Hard": "#ef4444"
};

const CATEGORY_ICONS = {
  "Emotional Connection": "heart",
  "Telepathic Experiences": "flash",
  "Behavioral Synchrony": "people",
  "Shared Experiences": "star",
  "Physical Sensations": "hand-left"
};

export const MicroExperimentCard: React.FC<MicroExperimentCardProps> = ({
  experiment,
  isCompleted,
  onComplete,
  accentColor
}) => {
  const scaleValue = useSharedValue(1);
  const checkScale = useSharedValue(isCompleted ? 1 : 0);
  
  React.useEffect(() => {
    checkScale.value = withSpring(isCompleted ? 1 : 0);
  }, [isCompleted]);
  
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }]
  }));
  
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }]
  }));

  const handlePress = () => {
    if (!isCompleted) {
      scaleValue.value = withSpring(0.98, {}, () => {
        scaleValue.value = withSpring(1);
      });
    }
  };

  const difficultyColor = DIFFICULTY_COLORS[experiment.difficulty];
  const categoryIcon = CATEGORY_ICONS[experiment.category as keyof typeof CATEGORY_ICONS] || "star";

  return (
    <Animated.View style={cardStyle}>
      <Pressable 
        onPress={handlePress}
        className={`rounded-xl p-4 ${
          isCompleted ? 'bg-white/5' : 'bg-white/10'
        }`}
        disabled={isCompleted}
      >
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <View 
                className="w-6 h-6 rounded-full items-center justify-center mr-2"
                style={{ backgroundColor: `${accentColor}30` }}
              >
                <Ionicons name={categoryIcon as any} size={12} color={accentColor} />
              </View>
              <Text className={`font-semibold ${
                isCompleted ? 'text-white/60' : 'text-white'
              }`}>
                {experiment.title}
              </Text>
            </View>
            
            <Text className={`text-sm leading-5 mb-2 ${
              isCompleted ? 'text-white/40' : 'text-white/80'
            }`}>
              {experiment.description}
            </Text>
            
            <View className="flex-row items-center space-x-3">
              <View className="flex-row items-center">
                <Ionicons 
                  name="time-outline" 
                  size={14} 
                  color={isCompleted ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.6)"} 
                />
                <Text className={`text-xs ml-1 ${
                  isCompleted ? 'text-white/30' : 'text-white/60'
                }`}>
                  {experiment.duration}
                </Text>
              </View>
              
              <View className="flex-row items-center">
                <View 
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ 
                    backgroundColor: isCompleted ? "rgba(255,255,255,0.2)" : difficultyColor 
                  }}
                />
                <Text className={`text-xs ${
                  isCompleted ? 'text-white/30' : 'text-white/60'
                }`}>
                  {experiment.difficulty}
                </Text>
              </View>
            </View>
          </View>
          
          <View className="ml-3">
            {isCompleted ? (
              <Animated.View 
                style={checkStyle}
                className="w-8 h-8 rounded-full items-center justify-center"
                backgroundColor={`${accentColor}40`}
              >
                <Ionicons name="checkmark" size={16} color={accentColor} />
              </Animated.View>
            ) : (
              <Pressable
                onPress={onComplete}
                className="w-8 h-8 rounded-full items-center justify-center border border-white/30"
              >
                <Ionicons name="play" size={14} color="white" />
              </Pressable>
            )}
          </View>
        </View>
        
        {!isCompleted && (
          <View className="border-t border-white/10 pt-3">
            <Pressable 
              onPress={onComplete}
              className="rounded-lg py-2 px-4"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <Text 
                className="text-center font-medium text-sm"
                style={{ color: accentColor }}
              >
                Start Experiment
              </Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};