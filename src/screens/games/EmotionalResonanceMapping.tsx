import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Image, ImageBackground, GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { useTwinStore } from '../../state/twinStore';
import * as Haptics from 'expo-haptics';

interface EmotionalResponse {
  imageId: string;
  emotionalRatings: {
    joy: number;
    sadness: number;
    peace: number;
    anxiety: number;
    love: number;
    curiosity: number;
  };
  somaticLocation: {
    x: number;
    y: number;
    area: 'head' | 'chest' | 'stomach' | 'full';
  };
  colorAssociation: string;
  wordAssociations: string[];
  responseTime: number;
}

interface EmotionalInsight {
  type: string;
  message: string;
  data: any;
}

// Abstract images that evoke different emotions
const abstractImages = [
  { id: 'swirl1', source: require('../../assets/abstract/swirl1.png'), name: 'Cosmic Swirl' },
  { id: 'fractal1', source: require('../../assets/abstract/fractal1.png'), name: 'Fractal Dreams' },
  { id: 'organic1', source: require('../../assets/abstract/organic1.png'), name: 'Organic Flow' },
  { id: 'geometric1', source: require('../../assets/abstract/geometric1.png'), name: 'Sacred Geometry' },
];

const emotionColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#F9C74F', '#90BE6D', '#8B5CF6',
  '#F72585', '#4361EE', '#F77F00', '#06FFA5', '#FF006E', '#3A86FF'
];

const wordOptions = [
  'flowing', 'sharp', 'warm', 'cold', 'expansive', 'contained',
  'rising', 'falling', 'vibrant', 'muted', 'chaotic', 'ordered',
  'ancient', 'new', 'familiar', 'strange', 'peaceful', 'energetic'
];

export const EmotionalResonanceMapping = ({ navigation }: any) => {
  const { themeColor, twinProfile, addGameResult } = useTwinStore();
  const [gamePhase, setGamePhase] = useState<'intro' | 'viewing' | 'rating' | 'mapping' | 'words' | 'result'>('intro');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [responses, setResponses] = useState<EmotionalResponse[]>([]);
  const [currentResponse, setCurrentResponse] = useState<Partial<EmotionalResponse>>({});
  const [startTime, setStartTime] = useState<number>(0);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [bodyMapLayout, setBodyMapLayout] = useState<{ width: number; height: number } | null>(null);

  const startNewImage = () => {
    setGamePhase('viewing');
    setStartTime(Date.now());
    setCurrentResponse({
      imageId: abstractImages[currentImageIndex].id,
      emotionalRatings: {
        joy: 0,
        sadness: 0,
        peace: 0,
        anxiety: 0,
        love: 0,
        curiosity: 0
      }
    });
    setSelectedWords([]);
    
    // Auto-advance after viewing time
    setTimeout(() => {
      setGamePhase('rating');
    }, 5000);
  };

  const handleEmotionRating = (emotion: keyof typeof currentResponse.emotionalRatings, value: number) => {
    setCurrentResponse(prev => ({
      ...prev,
      emotionalRatings: {
        ...prev.emotionalRatings!,
        [emotion]: value
      }
    }));
  };

  const handleBodyMapLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBodyMapLayout({ width, height });
  }, []);

  const handleBodyMapping = (event: GestureResponderEvent) => {
    if (!bodyMapLayout) {
      return;
    }

    const { locationX, locationY } = event.nativeEvent;
    const boundedX = Math.min(Math.max(locationX, 0), bodyMapLayout.width);
    const boundedY = Math.min(Math.max(locationY, 0), bodyMapLayout.height);

    const headThreshold = bodyMapLayout.height * 0.25;
    const chestThreshold = bodyMapLayout.height * 0.5;
    const stomachThreshold = bodyMapLayout.height * 0.75;

    const area = boundedY <= headThreshold
      ? 'head'
      : boundedY <= chestThreshold
        ? 'chest'
        : boundedY <= stomachThreshold
          ? 'stomach'
          : 'full';

    setCurrentResponse(prev => ({
      ...prev,
      somaticLocation: { x: boundedX, y: boundedY, area }
    }));

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleColorSelection = (color: string) => {
    setCurrentResponse(prev => ({ ...prev, colorAssociation: color }));
    setGamePhase('words');
  };

  const handleWordSelection = (word: string) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(prev => prev.filter(w => w !== word));
    } else if (selectedWords.length < 3) {
      setSelectedWords(prev => [...prev, word]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const completeCurrentImage = () => {
    const responseTime = Date.now() - startTime;
    const completeResponse: EmotionalResponse = {
      ...currentResponse as EmotionalResponse,
      wordAssociations: selectedWords,
      responseTime
    };
    
    setResponses(prev => [...prev, completeResponse]);
    
    // Move to next image or finish
    if (currentImageIndex < abstractImages.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
      startNewImage();
    } else {
      analyzeResults();
    }
  };

  const analyzeResults = () => {
    setGamePhase('result');
    const insights = generateEmotionalInsights();
    saveResults(insights);
  };

  const generateEmotionalInsights = (): EmotionalInsight[] => {
    const insights: EmotionalInsight[] = [];
    
    // Analyze dominant emotions
    const emotionTotals: Record<string, number> = {};
    responses.forEach(r => {
      Object.entries(r.emotionalRatings).forEach(([emotion, rating]) => {
        emotionTotals[emotion] = (emotionTotals[emotion] || 0) + rating;
      });
    });
    
    const dominantEmotion = Object.entries(emotionTotals)
      .sort(([,a], [,b]) => b - a)[0][0];
    
    insights.push({
      type: 'dominant_emotion',
      message: `Your emotional responses are primarily driven by ${dominantEmotion}`,
      data: { emotionTotals, dominant: dominantEmotion }
    });
    
    // Analyze somatic patterns
    const bodyAreas = responses.map(r => r.somaticLocation.area);
    const mostCommonArea = bodyAreas.sort((a, b) => 
      bodyAreas.filter(v => v === a).length - bodyAreas.filter(v => v === b).length
    ).pop();
    
    insights.push({
      type: 'somatic_pattern',
      message: `You tend to feel emotions most strongly in your ${mostCommonArea}`,
      data: { areas: bodyAreas, dominant: mostCommonArea }
    });
    
    // Analyze color-emotion associations
    const colorEmotionMap: Record<string, string[]> = {};
    responses.forEach(r => {
      const topEmotion = Object.entries(r.emotionalRatings)
        .sort(([,a], [,b]) => b - a)[0][0];
      if (!colorEmotionMap[r.colorAssociation]) {
        colorEmotionMap[r.colorAssociation] = [];
      }
      colorEmotionMap[r.colorAssociation].push(topEmotion);
    });
    
    insights.push({
      type: 'color_associations',
      message: `Your color-emotion synesthesia shows unique patterns`,
      data: colorEmotionMap
    });
    
    // Analyze word patterns
    const allWords = responses.flatMap(r => r.wordAssociations);
    const wordFrequency = allWords.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const emotionalVocabulary = Object.keys(wordFrequency).length;
    insights.push({
      type: 'emotional_vocabulary',
      message: `Your emotional vocabulary contains ${emotionalVocabulary} unique descriptors`,
      data: { wordFrequency, vocabularySize: emotionalVocabulary }
    });
    
    return insights;
  };

  const saveResults = (insights: EmotionalInsight[]) => {
    addGameResult({
      gameType: 'emotional_resonance',
      score: calculateEmotionalSyncScore(),
      twinScore: 0,
      insights,
      emotionalData: {
        responses,
        dominantEmotions: insights[0].data.emotionTotals,
        somaticPattern: insights[1].data,
        vocabularySize: insights[3].data.vocabularySize
      }
    });
  };

  const calculateEmotionalSyncScore = () => {
    // This will be properly calculated when comparing with twin's data
    const consistency = responses.reduce((acc, r) => {
      const ratings = Object.values(r.emotionalRatings);
      const variance = ratings.reduce((v, rating) => v + Math.pow(rating - 5, 2), 0) / ratings.length;
      return acc + (10 - variance);
    }, 0) / responses.length;
    
    return Math.round(consistency * 10);
  };

  const renderBodyMap = () => {
    return (
      <View className="bg-white/10 rounded-2xl p-6 items-center">
        <Text className="text-white text-lg mb-4">Where do you feel this emotion?</Text>
        <Pressable
          onLayout={handleBodyMapLayout}
          onPressIn={handleBodyMapping}
          className="w-48 h-80 bg-white/20 rounded-3xl relative"
        >
          {/* Simple body outline */}
          <View className="absolute top-4 left-1/2 -ml-12 w-24 h-24 rounded-full bg-white/10" />
          <View className="absolute top-28 left-1/2 -ml-16 w-32 h-40 rounded-t-3xl bg-white/10" />
          <View className="absolute bottom-0 left-1/2 -ml-16 w-32 h-32 bg-white/10" />
          
          {currentResponse.somaticLocation && (
            <View
              className="absolute w-8 h-8 rounded-full bg-purple-500"
              style={{
                left: currentResponse.somaticLocation.x - 16,
                top: currentResponse.somaticLocation.y - 16
              }}
            />
          )}
        </Pressable>
        
        {currentResponse.somaticLocation && (
          <Pressable
            onPress={() => setGamePhase('words')}
            className="mt-4 bg-purple-500 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Next</Text>
          </Pressable>
        )}
      </View>
    );
  };

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
            <Ionicons name="heart-circle" size={80} color="#ec4899" />
            <Text className="text-white text-3xl font-bold text-center mt-6 mb-4">
              Emotional Resonance Mapping
            </Text>
            <Text className="text-white/70 text-lg text-center mb-8 max-w-sm">
              We'll show you abstract images. Feel your emotional response, where it lives in your body, and what colors and words arise.
            </Text>
            <Pressable
              onPress={startNewImage}
              className="bg-pink-500 px-8 py-4 rounded-xl"
            >
              <Text className="text-white text-lg font-semibold">Begin Journey</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (gamePhase === 'viewing') {
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          {/* Header with back button */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <Pressable onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <Text className="text-white text-lg font-semibold">Feeling</Text>
            <View style={{ width: 24 }} />
          </View>
          <View className="flex-1 px-6 py-4 justify-center items-center">
            <Text className="text-white text-xl mb-4">Breathe and feel...</Text>
            <Image
              source={abstractImages[currentImageIndex].source}
              style={{ width: 300, height: 300 }}
              className="rounded-2xl"
            />
            <Text className="text-white/60 mt-4">
              {5 - Math.floor((Date.now() - startTime) / 1000)}s
            </Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (gamePhase === 'rating') {
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          {/* Header with back button */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <Pressable onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <Text className="text-white text-lg font-semibold">Rating</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView className="flex-1 px-6 py-4">
            <Text className="text-white text-2xl font-bold text-center mb-6">
              How does this make you feel?
            </Text>
            
            <View className="space-y-4">
              {Object.entries(currentResponse.emotionalRatings!).map(([emotion, value]) => (
                <View key={emotion}>
                  <Text className="text-white text-lg mb-2 capitalize">{emotion}</Text>
                  <Slider
                    minimumValue={0}
                    maximumValue={10}
                    value={value}
                    onValueChange={(v) => handleEmotionRating(emotion as any, v)}
                    minimumTrackTintColor="#8b5cf6"
                    maximumTrackTintColor="rgba(255,255,255,0.3)"
                    thumbTintColor="#8b5cf6"
                  />
                </View>
              ))}
            </View>
            
            <Pressable
              onPress={() => setGamePhase('mapping')}
              className="bg-purple-500 px-6 py-3 rounded-xl mt-6"
            >
              <Text className="text-white font-semibold text-center">Continue</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (gamePhase === 'mapping') {
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          {/* Header with back button */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <Pressable onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <Text className="text-white text-lg font-semibold">Body Mapping</Text>
            <View style={{ width: 24 }} />
          </View>
          <View className="flex-1 px-6 py-4 justify-center">
            {renderBodyMap()}
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (gamePhase === 'words') {
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          {/* Header with back button */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <Pressable onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <Text className="text-white text-lg font-semibold">Word Selection</Text>
            <View style={{ width: 24 }} />
          </View>
          <View className="flex-1 px-6 py-4">
            <Text className="text-white text-2xl font-bold text-center mb-6">
              Choose 3 words that resonate
            </Text>
            
            <View className="flex-row flex-wrap justify-center gap-3 mb-8">
              {wordOptions.map(word => (
                <Pressable
                  key={word}
                  onPress={() => handleWordSelection(word)}
                  className={`px-4 py-2 rounded-full ${
                    selectedWords.includes(word) ? 'bg-purple-500' : 'bg-white/20'
                  }`}
                >
                  <Text className="text-white">{word}</Text>
                </Pressable>
              ))}
            </View>
            
            <Text className="text-white text-xl mb-4 text-center">
              What color feels right?
            </Text>
            
            <View className="flex-row flex-wrap justify-center gap-3">
              {emotionColors.map(color => (
                <Pressable
                  key={color}
                  onPress={() => handleColorSelection(color)}
                  className="w-12 h-12 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </View>
            
            {selectedWords.length === 3 && currentResponse.colorAssociation && (
              <Pressable
                onPress={completeCurrentImage}
                className="bg-purple-500 px-6 py-3 rounded-xl mt-8 self-center"
              >
                <Text className="text-white font-semibold">
                  {currentImageIndex < abstractImages.length - 1 ? 'Next Image' : 'Complete'}
                </Text>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (gamePhase === 'result') {
    const insights = generateEmotionalInsights();
    
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          <ScrollView className="flex-1 px-6 py-4">
            <Text className="text-white text-2xl font-bold text-center mb-6">
              Emotional Resonance Profile
            </Text>
            
            <View className="bg-white/10 rounded-2xl p-6 mb-6">
              <Text className="text-white text-xl font-semibold mb-4">Your Emotional Patterns</Text>
              {insights.map((insight, index) => (
                <View key={index} className="mb-4">
                  <Text className="text-white/60 text-sm mb-1">
                    {insight.type.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                  <Text className="text-white text-base">
                    {insight.message}
                  </Text>
                </View>
              ))}
            </View>
            
            <LinearGradient
              colors={['rgba(236,72,153,0.2)', 'rgba(139,92,246,0.2)']}
              className="rounded-xl p-4 mb-6"
            >
              <Text className="text-white text-center">
                Your emotional fingerprint is being compared with {twinProfile?.name}'s...
              </Text>
            </LinearGradient>
            
            <View className="flex-row space-x-4">
              <Pressable
                onPress={() => navigation.goBack()}
                className="flex-1 bg-white/20 py-3 rounded-xl"
              >
                <Text className="text-white text-center font-semibold">Back to Games</Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return null;
};
