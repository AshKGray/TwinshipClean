import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Image, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTwinStore } from '../../state/twinStore';
import * as Haptics from 'expo-haptics';

interface Question {
  id: string;
  text: string;
  type: 'self' | 'twin' | 'relationship';
  options: {
    text: string;
    points: Record<string, number>;
  }[];
}

interface DuoProfile {
  id: string;
  names: string;
  category: string;
  description: string;
  dynamics: string[];
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const questions: Question[] = [
  {
    id: 'q1',
    text: 'In an argument, who apologizes first?',
    type: 'relationship',
    options: [
      { text: 'Always me', points: { 'leader-follower': 2, 'complementary': 1 } },
      { text: 'Always them', points: { 'leader-follower': 2, 'complementary': 1 } },
      { text: 'We both do simultaneously', points: { 'synchronized': 3, 'mirror': 2 } },
      { text: 'Neither - we just move on', points: { 'chaos': 2, 'independent': 1 } }
    ]
  },
  {
    id: 'q2',
    text: "Who's more likely to suggest a spontaneous road trip?",
    type: 'relationship',
    options: [
      { text: 'Definitely me', points: { 'leader-follower': 2, 'adventure': 2 } },
      { text: 'Definitely them', points: { 'leader-follower': 2, 'adventure': 2 } },
      { text: 'We both would at the same time', points: { 'synchronized': 3, 'chaos': 2 } },
      { text: 'Neither - we plan everything', points: { 'structured': 3, 'complementary': 1 } }
    ]
  },
  {
    id: 'q3',
    text: 'If you robbed a bank together, who would be the mastermind?',
    type: 'relationship',
    options: [
      { text: 'I\'d plan it all', points: { 'leader-follower': 3, 'strategic': 2 } },
      { text: 'They\'d be the brains', points: { 'leader-follower': 3, 'strategic': 2 } },
      { text: 'We\'d both plan equally', points: { 'synchronized': 3, 'partner': 2 } },
      { text: 'We\'d wing it together', points: { 'chaos': 3, 'spontaneous': 2 } }
    ]
  },
  {
    id: 'q4',
    text: 'Who cries at commercials?',
    type: 'self',
    options: [
      { text: 'Me, every time', points: { 'emotional': 3, 'empathetic': 2 } },
      { text: 'Them, always', points: { 'emotional': 3, 'empathetic': 2 } },
      { text: 'Both of us together', points: { 'synchronized': 3, 'emotional': 2 } },
      { text: 'Neither - we\'re stone cold', points: { 'stoic': 3, 'professional': 2 } }
    ]
  },
  {
    id: 'q5',
    text: 'Your superpower as a duo would be:',
    type: 'relationship',
    options: [
      { text: 'Reading each other\'s minds', points: { 'synchronized': 3, 'psychic': 3 } },
      { text: 'Perfect balance of opposites', points: { 'complementary': 3, 'balanced': 2 } },
      { text: 'Unstoppable chaos energy', points: { 'chaos': 3, 'wild': 2 } },
      { text: 'Strategic domination', points: { 'strategic': 3, 'professional': 2 } }
    ]
  },
  {
    id: 'q6',
    text: 'At a party, you two are:',
    type: 'relationship',
    options: [
      { text: 'The life of the party together', points: { 'synchronized': 2, 'social': 3 } },
      { text: 'One socializing, one observing', points: { 'complementary': 3, 'balanced': 2 } },
      { text: 'Starting separate adventures', points: { 'independent': 3, 'chaos': 1 } },
      { text: 'In a corner having deep talks', points: { 'intellectual': 3, 'deep': 2 } }
    ]
  }
];

const duoProfiles: DuoProfile[] = [
  {
    id: 'sherlock-watson',
    names: 'Sherlock & Watson',
    category: 'Complementary Intellects',
    description: 'One brilliant mind, one grounding force. Together, unstoppable.',
    dynamics: ['leader-follower', 'complementary', 'intellectual', 'strategic'],
    color: '#4f46e5',
    icon: 'flask'
  },
  {
    id: 'fred-george',
    names: 'Fred & George Weasley',
    category: 'Synchronized Mischief',
    description: 'Two halves of one chaotic whole. Finishing each other\'s pranks.',
    dynamics: ['synchronized', 'chaos', 'mirror', 'spontaneous'],
    color: '#f97316',
    icon: 'flash'
  },
  {
    id: 'thelma-louise',
    names: 'Thelma & Louise',
    category: 'Ride or Die',
    description: 'Adventure, loyalty, and going down together if needed.',
    dynamics: ['adventure', 'synchronized', 'emotional', 'wild'],
    color: '#ef4444',
    icon: 'car-sport'
  },
  {
    id: 'batman-robin',
    names: 'Batman & Robin',
    category: 'Mentor & Protégé',
    description: 'Teacher and student, protector and protected, dark and light.',
    dynamics: ['leader-follower', 'complementary', 'strategic', 'professional'],
    color: '#1f2937',
    icon: 'shield'
  },
  {
    id: 'spongebob-patrick',
    names: 'SpongeBob & Patrick',
    category: 'Chaotic Good Energy',
    description: 'Pure hearts, empty heads, infinite fun.',
    dynamics: ['chaos', 'emotional', 'spontaneous', 'social'],
    color: '#fbbf24',
    icon: 'star'
  },
  {
    id: 'venus-serena',
    names: 'Venus & Serena Williams',
    category: 'Competitive Support',
    description: 'Rivals on court, sisters off. Push each other to greatness.',
    dynamics: ['synchronized', 'professional', 'strategic', 'balanced'],
    color: '#10b981',
    icon: 'trophy'
  }
];

export const IconicDuoMatcher = ({ navigation }: any) => {
  const { themeColor, twinProfile, addGameResult } = useTwinStore();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [twinPredictions, setTwinPredictions] = useState<Record<string, any>>({});
  const [gamePhase, setGamePhase] = useState<'intro' | 'questions' | 'predictions' | 'calculating' | 'result'>('intro');
  const [matchedDuo, setMatchedDuo] = useState<DuoProfile | null>(null);

  const handleAnswer = (questionId: string, option: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (gamePhase === 'questions') {
      setAnswers(prev => ({ ...prev, [questionId]: option }));
    } else {
      setTwinPredictions(prev => ({ ...prev, [questionId]: option }));
    }
    
    // Move to next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      if (gamePhase === 'questions') {
        // Move to prediction phase
        setGamePhase('predictions');
        setCurrentQuestionIndex(0);
      } else {
        // Calculate results
        calculateDuoMatch();
      }
    }
  };

  const calculateDuoMatch = () => {
    setGamePhase('calculating');
    
    // Aggregate points
    const points: Record<string, number> = {};
    
    // Add points from answers
    Object.values(answers).forEach((answer: any) => {
      Object.entries(answer.points).forEach(([trait, score]) => {
        points[trait] = (points[trait] || 0) + (score as number);
      });
    });
    
    // Add points from predictions (if they match)
    Object.entries(twinPredictions).forEach(([questionId, prediction]: [string, any]) => {
      if (answers[questionId]?.text === prediction.text) {
        Object.entries(prediction.points).forEach(([trait, score]) => {
          points[trait] = (points[trait] || 0) + (score as number) * 0.5;
        });
      }
    });
    
    // Find best matching duo
    let bestMatch = duoProfiles[0];
    let bestScore = 0;
    
    duoProfiles.forEach(duo => {
      const score = duo.dynamics.reduce((acc, trait) => {
        return acc + (points[trait] || 0);
      }, 0);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = duo;
      }
    });
    
    setMatchedDuo(bestMatch);
    
    setTimeout(() => {
      setGamePhase('result');
      saveResults(bestMatch);
    }, 2000);
  };

  const saveResults = (duo: DuoProfile) => {
    const perceptionGap = calculatePerceptionGap();
    
    addGameResult({
      gameType: 'iconic_duo',
      score: 100 - perceptionGap, // Higher score for better perception alignment
      twinScore: 0,
      insights: [
        {
          type: 'duo_match',
          message: `You're most like ${duo.names}: ${duo.description}`,
          data: { duoId: duo.id, category: duo.category }
        },
        {
          type: 'perception_gap',
          message: `Your perception alignment with ${twinProfile?.name} is ${100 - perceptionGap}%`,
          data: { gap: perceptionGap }
        }
      ],
      duoData: {
        matchedDuo: duo.id,
        answers,
        predictions: twinPredictions,
        perceptionGap
      }
    });
  };

  const calculatePerceptionGap = () => {
    let mismatches = 0;
    Object.keys(answers).forEach(questionId => {
      if (answers[questionId]?.text !== twinPredictions[questionId]?.text) {
        mismatches++;
      }
    });
    return Math.round((mismatches / questions.length) * 100);
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (gamePhase === 'intro') {
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          {/* Header with back button */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <Pressable onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <Text className="text-white text-lg font-semibold">Games</Text>
            <View style={{ width: 24 }} />
          </View>
          <View className="flex-1 px-6 py-4 justify-center items-center">
            <Ionicons name="people" size={80} color="#8b5cf6" />
            <Text className="text-white text-3xl font-bold text-center mt-6 mb-4">
              Which Iconic Duo Are You?
            </Text>
            <Text className="text-white/70 text-lg text-center mb-8 max-w-sm">
              Answer questions about your relationship, then predict what {twinProfile?.name} would say. 
              Discover which famous duo represents your twin dynamic!
            </Text>
            <Pressable
              onPress={() => setGamePhase('questions')}
              className="bg-purple-500 px-8 py-4 rounded-xl"
            >
              <Text className="text-white text-lg font-semibold">Start Quiz</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (gamePhase === 'questions' || gamePhase === 'predictions') {
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          {/* Header with back button */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <Pressable onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <Text className="text-white text-lg font-semibold">Quiz</Text>
            <View style={{ width: 24 }} />
          </View>
          <View className="flex-1 px-6 py-4">
            {/* Progress bar */}
            <View className="mb-6">
              <Text className="text-white text-center mb-2">
                {gamePhase === 'questions' ? 'Your Answers' : `Predict ${twinProfile?.name}'s Answers`}
              </Text>
              <View className="bg-white/10 h-2 rounded-full overflow-hidden">
                <View 
                  className="bg-purple-500 h-full rounded-full"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </View>
              <Text className="text-white/60 text-center mt-2 text-sm">
                Question {currentQuestionIndex + 1} of {questions.length}
              </Text>
            </View>
            
            {/* Question */}
            <View className="flex-1 justify-center">
              <Text className="text-white text-2xl font-bold text-center mb-8">
                {currentQuestion.text}
              </Text>
              
              {/* Options */}
              <View className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <Pressable
                    key={index}
                    onPress={() => handleAnswer(currentQuestion.id, option)}
                    className="bg-white/10 p-5 rounded-xl"
                  >
                    <Text className="text-white text-lg text-center">
                      {option.text}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (gamePhase === 'calculating') {
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          <View className="flex-1 justify-center items-center px-6">
            <View className="w-32 h-32 border-4 border-purple-500 rounded-full animate-spin" />
            <Text className="text-white text-xl mt-6">Analyzing your twin dynamic...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (gamePhase === 'result' && matchedDuo) {
    const perceptionGap = calculatePerceptionGap();
    
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          <ScrollView className="flex-1 px-6 py-4">
            <Text className="text-white text-2xl font-bold text-center mb-6">
              Your Iconic Duo Match
            </Text>
            
            {/* Duo Result */}
            <LinearGradient
              colors={[`${matchedDuo.color}40`, `${matchedDuo.color}20`]}
              className="rounded-2xl p-6 mb-6 items-center"
            >
              <Ionicons name={matchedDuo.icon} size={60} color={matchedDuo.color} />
              <Text className="text-white text-3xl font-bold mt-4">
                {matchedDuo.names}
              </Text>
              <Text className="text-white/80 text-lg mt-2 mb-4">
                {matchedDuo.category}
              </Text>
              <Text className="text-white/70 text-center">
                {matchedDuo.description}
              </Text>
            </LinearGradient>
            
            {/* Perception Analysis */}
            <View className="bg-white/10 rounded-xl p-6 mb-6">
              <Text className="text-white text-xl font-semibold mb-4">
                Perception Alignment
              </Text>
              <Text className="text-white/80 mb-4">
                You and {twinProfile?.name} see your relationship with {100 - perceptionGap}% alignment
              </Text>
              
              {/* Show mismatches */}
              {perceptionGap > 0 && (
                <View className="space-y-2">
                  <Text className="text-white/60 text-sm mb-2">Areas of Different Perspectives:</Text>
                  {Object.keys(answers).map(questionId => {
                    if (answers[questionId]?.text !== twinPredictions[questionId]?.text) {
                      const question = questions.find(q => q.id === questionId)!;
                      return (
                        <View key={questionId} className="bg-white/10 rounded p-3">
                          <Text className="text-white/80 text-sm mb-1">{question.text}</Text>
                          <Text className="text-white/60 text-xs">
                            You: {answers[questionId]?.text} | 
                            Predicted: {twinPredictions[questionId]?.text}
                          </Text>
                        </View>
                      );
                    }
                    return null;
                  })}
                </View>
              )}
            </View>
            
            {/* Social Sharing */}
            <View className="bg-purple-500/20 rounded-xl p-4 mb-6">
              <Text className="text-white text-center">
                Share your duo match with friends! 
                Screenshot this result and tag your twin.
              </Text>
            </View>
            
            <Pressable
              onPress={() => navigation.goBack()}
              className="bg-white/20 py-3 rounded-xl"
            >
              <Text className="text-white text-center font-semibold">Back to Games</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return null;
};