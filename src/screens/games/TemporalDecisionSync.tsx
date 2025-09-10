import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTwinStore } from '../../state/twinStore';
import * as Haptics from 'expo-haptics';

interface Scenario {
  id: string;
  title: string;
  prompt: string;
  options: string[];
  timeLimit: number;
  category: 'crisis' | 'resource' | 'social' | 'ethical';
}

interface Decision {
  scenarioId: string;
  choices: string[];
  timeToDecide: number;
  timestamp: number;
  stressLevel: 'low' | 'medium' | 'high';
}

interface DecisionInsight {
  type: string;
  message: string;
  data: any;
}

const scenarios: Scenario[] = [
  {
    id: 'fire_rescue',
    title: 'Emergency Evacuation',
    prompt: 'Your house is on fire! You can save 3 items:',
    options: ['Photo albums', 'Laptop/work', 'Pet supplies', 'Important documents', 'Jewelry/valuables', 'Artwork', 'Cash/cards', 'Family heirlooms', 'Electronics', 'Clothing'],
    timeLimit: 60,
    category: 'crisis'
  },
  {
    id: 'sudden_wealth',
    title: 'Instant Fortune',
    prompt: 'You have $1000 and 60 seconds to spend it:',
    options: ['Travel/experiences', 'Technology', 'Charity', 'Investments', 'Education/courses', 'Gifts for others', 'Home improvement', 'Health/wellness', 'Entertainment', 'Save it'],
    timeLimit: 60,
    category: 'resource'
  },
  {
    id: 'zombie_team',
    title: 'Survival Squad',
    prompt: 'Pick 5 people for your zombie apocalypse team:',
    options: ['Doctor/medic', 'Military/security', 'Engineer', 'Farmer', 'Teacher', 'Chef', 'Mechanic', 'Leader/politician', 'Athlete', 'Scientist', 'Artist', 'Comedian', 'Survivalist', 'Psychologist', 'Child'],
    timeLimit: 30,
    category: 'social'
  },
  {
    id: 'time_machine',
    title: 'Timeline Intervention',
    prompt: 'You can prevent 3 historical events. Choose:',
    options: ['Major wars', 'Pandemics', 'Natural disasters', 'Assassinations', 'Economic crashes', 'Environmental disasters', 'Genocides', 'Technological accidents', 'Cultural losses', 'Nothing - preserve timeline'],
    timeLimit: 45,
    category: 'ethical'
  },
  {
    id: 'desert_island',
    title: 'Island Essentials',
    prompt: 'Stranded on an island. Pick 5 items:',
    options: ['Knife', 'Lighter/matches', 'First aid kit', 'Water purifier', 'Fishing gear', 'Shelter materials', 'Solar charger', 'Radio', 'Rope', 'Mirror', 'Compass', 'Books', 'Seeds', 'Tools', 'Companion'],
    timeLimit: 40,
    category: 'crisis'
  }
];

export const TemporalDecisionSync = ({ navigation }: any) => {
  const { themeColor, twinProfile, addGameResult } = useTwinStore();
  const [gamePhase, setGamePhase] = useState<'intro' | 'scenario' | 'deciding' | 'timeout' | 'result'>('intro');
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [scenarioStartTime, setScenarioStartTime] = useState(0);
  const [stressIndicator, setStressIndicator] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (gamePhase === 'deciding' && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          
          // Increase stress as time runs out
          if (prev <= 10) {
            setStressIndicator(3);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          } else if (prev <= 20) {
            setStressIndicator(2);
          } else {
            setStressIndicator(1);
          }
          
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(timer);
  }, [gamePhase, timeRemaining]);

  const startScenario = () => {
    const scenario = scenarios[currentScenarioIndex];
    setGamePhase('scenario');
    
    // Show scenario for 5 seconds
    setTimeout(() => {
      setGamePhase('deciding');
      setTimeRemaining(scenario.timeLimit);
      setScenarioStartTime(Date.now());
    }, 5000);
  };

  const handleOptionToggle = (option: string) => {
    const scenario = scenarios[currentScenarioIndex];
    const maxSelections = scenario.id === 'zombie_team' || scenario.id === 'desert_island' ? 5 : 3;
    
    if (selectedOptions.includes(option)) {
      setSelectedOptions(prev => prev.filter(o => o !== option));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (selectedOptions.length < maxSelections) {
      setSelectedOptions(prev => [...prev, option]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleConfirmDecision = () => {
    const timeToDecide = (Date.now() - scenarioStartTime) / 1000;
    const scenario = scenarios[currentScenarioIndex];
    
    const decision: Decision = {
      scenarioId: scenario.id,
      choices: selectedOptions,
      timeToDecide,
      timestamp: Date.now(),
      stressLevel: stressIndicator === 3 ? 'high' : stressIndicator === 2 ? 'medium' : 'low'
    };
    
    setDecisions(prev => [...prev, decision]);
    
    // Move to next scenario or finish
    if (currentScenarioIndex < scenarios.length - 1) {
      setCurrentScenarioIndex(prev => prev + 1);
      setSelectedOptions([]);
      setStressIndicator(0);
      setTimeout(startScenario, 1500);
    } else {
      analyzeDecisions();
    }
  };

  const handleTimeout = () => {
    setGamePhase('timeout');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    // Auto-select if not enough choices
    const scenario = scenarios[currentScenarioIndex];
    const minRequired = scenario.id === 'zombie_team' || scenario.id === 'desert_island' ? 5 : 3;
    
    if (selectedOptions.length < minRequired) {
      const remaining = scenario.options
        .filter(o => !selectedOptions.includes(o))
        .slice(0, minRequired - selectedOptions.length);
      setSelectedOptions(prev => [...prev, ...remaining]);
    }
    
    setTimeout(handleConfirmDecision, 1000);
  };

  const analyzeDecisions = () => {
    setGamePhase('result');
    const insights = generateDecisionInsights();
    saveResults(insights);
  };

  const generateDecisionInsights = (): DecisionInsight[] => {
    const insights: DecisionInsight[] = [];
    
    // Analyze value priorities
    const valueCounts: Record<string, number> = {
      practical: 0,
      emotional: 0,
      social: 0,
      survival: 0,
      ethical: 0
    };
    
    decisions.forEach(d => {
      d.choices.forEach(choice => {
        if (['Laptop/work', 'Important documents', 'Investments', 'Water purifier'].includes(choice)) {
          valueCounts.practical++;
        } else if (['Photo albums', 'Family heirlooms', 'Artwork', 'Companion'].includes(choice)) {
          valueCounts.emotional++;
        } else if (['Gifts for others', 'Charity', 'Teacher', 'Psychologist'].includes(choice)) {
          valueCounts.social++;
        } else if (['Knife', 'First aid kit', 'Doctor/medic', 'Military/security'].includes(choice)) {
          valueCounts.survival++;
        }
      });
    });
    
    const dominantValue = Object.entries(valueCounts)
      .sort(([,a], [,b]) => b - a)[0][0];
    
    insights.push({
      type: 'value_system',
      message: `Your decisions reveal a ${dominantValue} value system under pressure`,
      data: { valueCounts, dominant: dominantValue }
    });
    
    // Analyze decision speed
    const avgDecisionTime = decisions.reduce((acc, d) => acc + d.timeToDecide, 0) / decisions.length;
    const speedCategory = avgDecisionTime < 20 ? 'rapid' : avgDecisionTime < 40 ? 'moderate' : 'deliberate';
    
    insights.push({
      type: 'decision_speed',
      message: `You make ${speedCategory} decisions (avg ${avgDecisionTime.toFixed(1)}s)`,
      data: { avgTime: avgDecisionTime, category: speedCategory }
    });
    
    // Analyze stress impact
    const highStressDecisions = decisions.filter(d => d.stressLevel === 'high');
    const stressImpact = highStressDecisions.length / decisions.length;
    
    insights.push({
      type: 'stress_response',
      message: `${Math.round(stressImpact * 100)}% of your decisions were made under high stress`,
      data: { stressImpact, highStressCount: highStressDecisions.length }
    });
    
    // Analyze risk tolerance
    const riskChoices = decisions.flatMap(d => d.choices)
      .filter(c => ['Nothing - preserve timeline', 'Save it', 'Investments'].includes(c));
    const riskScore = riskChoices.length > 2 ? 'conservative' : 'moderate';
    
    insights.push({
      type: 'risk_profile',
      message: `Your risk tolerance appears to be ${riskScore}`,
      data: { riskChoices, profile: riskScore }
    });
    
    return insights;
  };

  const saveResults = (insights: DecisionInsight[]) => {
    const score = calculateDecisionScore();
    
    addGameResult({
      gameType: 'temporal_decision',
      score,
      twinScore: 0,
      insights,
      decisionData: {
        decisions,
        dominantValue: insights[0].data.dominant,
        avgDecisionTime: insights[1].data.avgTime,
        stressImpact: insights[2].data.stressImpact
      }
    });
  };

  const calculateDecisionScore = () => {
    // Score based on consistency and decisiveness
    const decisiveness = decisions.reduce((acc, d) => {
      const scenario = scenarios.find(s => s.id === d.scenarioId)!;
      const expectedChoices = scenario.id === 'zombie_team' || scenario.id === 'desert_island' ? 5 : 3;
      return acc + (d.choices.length === expectedChoices ? 20 : 10);
    }, 0) / decisions.length;
    
    const speedScore = decisions.reduce((acc, d) => {
      return acc + Math.max(0, 20 - d.timeToDecide / 3);
    }, 0) / decisions.length;
    
    return Math.round(decisiveness + speedScore);
  };

  const getStressColor = () => {
    switch (stressIndicator) {
      case 3: return '#ef4444';
      case 2: return '#f59e0b';
      case 1: return '#10b981';
      default: return '#6b7280';
    }
  };

  if (gamePhase === 'intro') {
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          {/* Header with back button */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <Pressable onPress={() => navigation.navigate('Twingames')}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <Text className="text-white text-lg font-semibold">Games</Text>
            <View style={{ width: 24 }} />
          </View>
          <View className="flex-1 px-6 py-4 justify-center items-center">
            <Ionicons name="timer" size={80} color="#f59e0b" />
            <Text className="text-white text-3xl font-bold text-center mt-6 mb-4">
              Temporal Decision Synchrony
            </Text>
            <Text className="text-white/70 text-lg text-center mb-8 max-w-sm">
              Make rapid-fire decisions in high-pressure scenarios. We'll analyze how your values and instincts align with {twinProfile?.name}.
            </Text>
            <Pressable
              onPress={startScenario}
              className="bg-yellow-500 px-8 py-4 rounded-xl"
            >
              <Text className="text-white text-lg font-semibold">Start Challenge</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (gamePhase === 'scenario') {
    const scenario = scenarios[currentScenarioIndex];
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          {/* Header with back button */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <Pressable onPress={() => navigation.navigate('Twingames')}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <Text className="text-white text-lg font-semibold">Challenge</Text>
            <View style={{ width: 24 }} />
          </View>
          <View className="flex-1 px-6 py-4 justify-center items-center">
            <View className="bg-black/20 rounded-2xl p-6 mb-8">
              <Text className="text-white text-2xl font-bold text-center mb-4">
                {scenario.title}
              </Text>
              <Text className="text-white/90 text-lg text-center">
                {scenario.prompt}
              </Text>
            </View>
            <Text className="text-white/60 text-lg">
              Get ready... Decision time starts in 5 seconds
            </Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (gamePhase === 'deciding') {
    const scenario = scenarios[currentScenarioIndex];
    const maxSelections = scenario.id === 'zombie_team' || scenario.id === 'desert_island' ? 5 : 3;
    
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          {/* Timer and stress indicator */}
          <View className="flex-row justify-between items-center p-4 bg-black/20">
            <Pressable onPress={() => navigation.navigate('Twingames')}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <View className="flex-row items-center">
              <View 
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: getStressColor() }}
              />
              <Text className="text-white text-lg">
                Stress Level
              </Text>
            </View>
            <Text className="text-white text-2xl font-bold">
              {timeRemaining}s
            </Text>
          </View>

          {/* Scenario prompt */}
          <View className="px-6 py-4">
            <Text className="text-white text-xl font-bold mb-2">
              {scenario.title}
            </Text>
            <Text className="text-white/90 text-lg mb-4">
              {scenario.prompt}
            </Text>
            <Text className="text-white/60 text-sm">
              Select {maxSelections} options ({selectedOptions.length}/{maxSelections})
            </Text>
          </View>

          {/* Options */}
          <ScrollView className="flex-1 px-6">
            <View className="flex-row flex-wrap justify-between">
              {scenario.options.map((option, index) => {
                const isSelected = selectedOptions.includes(option);
                return (
                  <Pressable
                    key={index}
                    onPress={() => handleOptionToggle(option)}
                    className={`w-[48%] mb-3 p-4 rounded-xl border-2 ${
                      isSelected 
                        ? 'bg-yellow-500/20 border-yellow-500' 
                        : 'bg-white/10 border-white/30'
                    }`}
                  >
                    <Text className={`text-center font-medium ${
                      isSelected ? 'text-yellow-400' : 'text-white'
                    }`}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Confirm button */}
          {selectedOptions.length === maxSelections && (
            <View className="p-6">
              <Pressable
                onPress={handleConfirmDecision}
                className="bg-green-500 py-4 rounded-xl"
              >
                <Text className="text-white text-lg font-semibold text-center">
                  Confirm Decisions
                </Text>
              </Pressable>
            </View>
          )}
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (gamePhase === 'timeout') {
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          <View className="flex-1 justify-center items-center px-6">
            <Ionicons name="time" size={80} color="#ef4444" />
            <Text className="text-white text-2xl font-bold text-center mt-4 mb-2">
              Time's Up!
            </Text>
            <Text className="text-white/70 text-lg text-center">
              Auto-selecting remaining choices...
            </Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (gamePhase === 'result') {
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          <ScrollView className="flex-1 px-6 py-4">
            <Text className="text-white text-3xl font-bold text-center mb-6">
              Decision Analysis
            </Text>
            
            {/* Generate insights display */}
            <View className="space-y-4">
              {generateDecisionInsights().map((insight, index) => (
                <View key={index} className="bg-white/10 rounded-xl p-4">
                  <Text className="text-white text-lg font-semibold mb-2">
                    {insight.type.replace('_', ' ').toUpperCase()}
                  </Text>
                  <Text className="text-white/80 text-base">
                    {insight.message}
                  </Text>
                </View>
              ))}
            </View>

            <View className="mt-8 space-y-4">
              <Pressable
                onPress={() => navigation.navigate('Twingames')}
                className="bg-blue-500 py-4 rounded-xl"
              >
                <Text className="text-white text-lg font-semibold text-center">
                  Return to Games
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  // Default return (should never reach here)
  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <View className="flex-1 justify-center items-center">
          <Text className="text-white text-xl">Loading...</Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};