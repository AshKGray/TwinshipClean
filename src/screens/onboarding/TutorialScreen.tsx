/**
 * TutorialScreen - Story 1.5
 *
 * Onboarding tutorial with swipeable carousel highlighting key features.
 * Shows once after pairing, never again.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  Dimensions,
  ViewToken,
} from 'react-native';
import { ImageBackground } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import { useTwinStore } from '../../state/twinStore';
import NeonButton from '../../components/common/NeonButton';
import CosmicCard from '../../components/common/CosmicCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TutorialSlide {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    id: '1',
    title: 'Welcome to Twinship!',
    description: 'Explore your unique twin connection through games, insights, and shared experiences. This is your space to strengthen your bond.',
    icon: 'sparkles',
    color: '#4A9FFF',
  },
  {
    id: '2',
    title: 'Play Psychic Games',
    description: 'Discover how in-sync you are through fun psychological games. Test your cognitive synchrony, emotional resonance, and decision alignment.',
    icon: 'game-controller',
    color: '#9B7EDE',
  },
  {
    id: '3',
    title: 'Send Twintuition Alerts',
    description: 'Instantly notify your twin when you\'re thinking of them. Track those special moments when you both sense the same thing at the same time.',
    icon: 'flash',
    color: '#4ECDC4',
  },
  {
    id: '4',
    title: 'Document Twincidences',
    description: 'Create and share stories celebrating your twin journey. Capture those amazing coincidences and meaningful moments together.',
    icon: 'book',
    color: '#FF6B9D',
  },
  {
    id: '5',
    title: 'Contribute to Research',
    description: 'Help advance twin science by participating in optional research studies. Your data contributes to understanding twin connections.',
    icon: 'school',
    color: '#FFB84D',
  },
];

const TUTORIAL_COMPLETED_KEY = 'twinship:v1:tutorialCompleted';

export const TutorialScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { userProfile } = useTwinStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const isLastSlide = currentIndex === TUTORIAL_SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      handleComplete();
    } else {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSkip = async () => {
    await markTutorialComplete();
    navigation.navigate('Main', { screen: 'Home' });
  };

  const handleComplete = async () => {
    await markTutorialComplete();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.navigate('Main', { screen: 'Home' });
  };

  const markTutorialComplete = async () => {
    try {
      const completionData = {
        completed: true,
        completedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, JSON.stringify(completionData));
    } catch (error) {
      console.error('Failed to mark tutorial as complete:', error);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderSlide = ({ item }: { item: TutorialSlide }) => (
    <View style={{ width: SCREEN_WIDTH }} className="px-6 py-8">
      <CosmicCard
        blur
        glowBorder
        accentColor={userProfile?.accentColor || 'stellar-blue'}
        padding={32}
        testID={`tutorial-slide-${item.id}`}
      >
        <View className="items-center">
          {/* Icon */}
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-8"
            style={{ backgroundColor: item.color + '20' }}
          >
            <Ionicons name={item.icon} size={48} color={item.color} />
          </View>

          {/* Title */}
          <Text className="text-white text-3xl font-bold text-center mb-6">
            {item.title}
          </Text>

          {/* Description */}
          <Text className="text-white/80 text-lg text-center leading-7">
            {item.description}
          </Text>
        </View>
      </CosmicCard>
    </View>
  );

  const renderDots = () => (
    <View className="flex-row justify-center space-x-2 py-6">
      {TUTORIAL_SLIDES.map((_, index) => (
        <View
          key={index}
          className={`h-2 rounded-full transition-all ${
            index === currentIndex ? 'w-8' : 'w-2'
          }`}
          style={{
            backgroundColor: index === currentIndex
              ? userProfile?.accentColor
                ? `${userProfile.accentColor}FF`
                : '#4A9FFF'
              : 'rgba(255, 255, 255, 0.3)',
          }}
        />
      ))}
    </View>
  );

  return (
    <ImageBackground
      source={require('../../../assets/galaxybackground.png')}
      style={{ flex: 1 }}
      contentFit="cover"
      placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
      transition={200}
    >
      <SafeAreaView className="flex-1">
        <View className="flex-1">
          {/* Header with Skip Button */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <View className="w-16" />
            <Text className="text-white/60 text-sm">
              {currentIndex + 1} of {TUTORIAL_SLIDES.length}
            </Text>
            <Pressable onPress={handleSkip} className="px-4 py-2">
              <Text className="text-white/70 font-medium">Skip</Text>
            </Pressable>
          </View>

          {/* Carousel */}
          <FlatList
            ref={flatListRef}
            data={TUTORIAL_SLIDES}
            renderItem={renderSlide}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            bounces={false}
            scrollEventThrottle={16}
          />

          {/* Progress Dots */}
          {renderDots()}

          {/* Navigation Button */}
          <View className="px-6 pb-6">
            <NeonButton
              variant="primary"
              accentColor={userProfile?.accentColor || 'celestial-indigo'}
              onPress={handleNext}
              size="large"
              fullWidth
              icon={
                <Ionicons
                  name={isLastSlide ? "checkmark-circle" : "arrow-forward"}
                  size={24}
                  color="white"
                />
              }
              iconPosition="right"
            >
              {isLastSlide ? 'Get Started' : 'Next'}
            </NeonButton>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};
