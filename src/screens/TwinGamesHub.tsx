import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  runOnJS
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SyncScoreDisplay } from '../components/games/SyncScoreDisplay';
import { useTwinStore } from '../state/twinStore';
import { useGameStore } from '../state/stores/games/gameStore';
import { useGameConfig } from '../hooks/games/useGameConfig';
import { getNeonAccentColor, getNeonAccentColorWithOpacity } from '../utils/neonColors';

interface TwinGamesHubProps {
  navigation: any;
}

export const TwinGamesHub: React.FC<TwinGamesHubProps> = ({ navigation }) => {
  const { width } = Dimensions.get('window');
  const { userProfile, twinProfile } = useTwinStore();
  const { syncMetrics, achievements, createGameSession } = useGameStore();
  const { allGames } = useGameConfig();
  
  // Memoize theme calculations
  const themeConfig = useMemo(() => {
    const themeColor = userProfile?.accentColor || 'neon-purple';
    const accentColor = getNeonAccentColor(themeColor);
    return { themeColor, accentColor };
  }, [userProfile?.accentColor]);
  
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  
  const gameScales = allGames.map(() => useSharedValue(0));
  const headerOpacity = useSharedValue(0);
  const statsOpacity = useSharedValue(0);
  
  React.useEffect(() => {
    // Preload game screens when hub is opened
    const preloadGameScreens = async () => {
      try {
        // Import game screen modules to preload them
        const gameModules = [
          import('./games/CognitiveSyncMaze'),
          import('./games/EmotionalResonanceMapping'),
          import('./games/IconicDuoMatcher'),
          import('./games/TemporalDecisionSync')
        ];
        await Promise.all(gameModules);
      } catch (error) {
        console.log('Game preloading in progress...');
      }
    };
    
    preloadGameScreens();
    
    // Staggered entrance animations
    headerOpacity.value = withSpring(1, { damping: 15 });
    statsOpacity.value = withDelay(200, withSpring(1, { damping: 15 }));
    
    gameScales.forEach((scale, index) => {
      scale.value = withDelay(
        400 + (index * 100),
        withSpring(1, { damping: 20, stiffness: 200 })
      );
    });
  }, []);
  
  const headerStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [{ translateY: withSpring(headerOpacity.value === 1 ? 0 : -20) }]
    };
  });
  
  const statsStyle = useAnimatedStyle(() => {
    return {
      opacity: statsOpacity.value,
      transform: [{ scale: withSpring(statsOpacity.value) }]
    };
  });
  
  const startGame = useCallback(async (gameType: string) => {
    if (!twinProfile) {
      // Show pairing required message
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsInviting(true);

    try {
      // Create game session
      const session = createGameSession(gameType as any, twinProfile.id);

      // Navigate to specific game screen
      setTimeout(() => {
        setIsInviting(false);
        navigation.navigate(getGameScreenName(gameType), { sessionId: session.id });
      }, 1000);

    } catch (error) {
      console.error('Failed to start game:', error);
      setIsInviting(false);
    }
  }, [twinProfile, createGameSession, navigation]);
  
  const getGameScreenName = useCallback((gameType: string): string => {
    switch (gameType) {
      case 'cognitive_sync_maze': return 'CognitiveSyncMaze';
      case 'emotional_resonance': return 'EmotionalResonanceMapping';
      case 'temporal_decision': return 'TemporalDecisionSync';
      case 'iconic_duo': return 'IconicDuoMatcher';
      default: return 'CognitiveSyncMaze';
    }
  }, []);

  const getDifficultyColor = useCallback((difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  }, []);
  
  // Memoize expensive achievement filtering
  const recentAchievements = useMemo(() =>
    achievements.filter((a: any) => a.unlocked).slice(0, 3),
    [achievements]
  );
  
  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Animated.View style={headerStyle} className="py-6">
            <View className="flex-row items-center justify-between mb-4">
              <Pressable
                onPress={() => navigation.goBack()}
                className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
              >
                <Ionicons name="arrow-back" size={20} color="white" />
              </Pressable>
              
              <Text className="text-white text-2xl font-bold">Psychic Games</Text>
              
              <Pressable
                onPress={() => navigation.navigate('GameStats')}
                className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
              >
                <Ionicons name="stats-chart" size={20} color="white" />
              </Pressable>
            </View>
            
            <Text className="text-white/70 text-center">
              Test your twin synchronicity through mystical games
            </Text>
          </Animated.View>
          
          {/* Twin Connection Status */}
          {twinProfile ? (
            <View className="bg-white/10 rounded-2xl p-4 mb-6 backdrop-blur">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-green-500 mr-3" />
                  <View>
                    <Text className="text-white font-semibold">
                      Connected to {twinProfile.name}
                    </Text>
                    <Text className="text-white/70 text-sm">
                      Ready for psychic games
                    </Text>
                  </View>
                </View>
                <Ionicons name="people" size={24} color={themeConfig.accentColor} />
              </View>
            </View>
          ) : (
            <View className="bg-white/10 rounded-2xl p-4 mb-6 backdrop-blur border border-yellow-500/30">
              <View className="flex-row items-center">
                <Ionicons name="warning" size={24} color="#f59e0b" />
                <View className="ml-3 flex-1">
                  <Text className="text-white font-semibold">
                    Twin Connection Required
                  </Text>
                  <Text className="text-white/70 text-sm">
                    Invite your twin to play psychic games together
                  </Text>
                </View>
              </View>
            </View>
          )}
          
          {/* Sync Score Display */}
          <Animated.View style={statsStyle} className="mb-8">
            <SyncScoreDisplay
              metrics={syncMetrics}
              themeColor={themeConfig.themeColor}
            />
          </Animated.View>
          
          {/* Recent Achievements */}
          {recentAchievements.length > 0 && (
            <View className="mb-6">
              <Text className="text-white text-lg font-semibold mb-3">
                Recent Achievements
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row space-x-3">
                  {recentAchievements.map((achievement: any, index: number) => (
                    <View 
                      key={achievement.id}
                      className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-3 min-w-[120px]"
                    >
                      <Ionicons name={achievement.icon as any} size={24} color="#f59e0b" />
                      <Text className="text-white font-semibold text-sm mt-1">
                        {achievement.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
          
          {/* Games Grid */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-4">
              Choose Your Psychic Challenge
            </Text>
            
            <View className="space-y-4">
              {allGames.map((game, index) => {
                const gameStyle = useAnimatedStyle(() => {
                  return {
                    transform: [{ scale: gameScales[index].value }],
                    opacity: gameScales[index].value
                  };
                });
                
                return (
                  <Animated.View key={game.id} style={gameStyle}>
                    <Pressable
                      onPress={() => startGame(game.id as string)}
                      disabled={!twinProfile || isInviting}
                      className={`rounded-2xl p-6 ${
                        !twinProfile ? 'opacity-50' : ''
                      }`}
                      style={{
                        backgroundColor: getNeonAccentColorWithOpacity(themeConfig.themeColor, 0.1)
                      }}
                    >
                      <View className="flex-row items-center">
                        {/* Game Icon */}
                        <View 
                          className="w-16 h-16 rounded-xl items-center justify-center mr-4"
                          style={{
                            backgroundColor: getNeonAccentColorWithOpacity(themeConfig.themeColor, 0.3)
                          }}
                        >
                          <Ionicons 
                            name={game.icon as any} 
                            size={32} 
                            color={themeConfig.accentColor}
                          />
                        </View>
                        
                        {/* Game Info */}
                        <View className="flex-1">
                          <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-white text-xl font-semibold">
                              {game.name}
                            </Text>
                            <View 
                              className="px-3 py-1 rounded-full"
                              style={{ backgroundColor: getDifficultyColor(game.difficulty) + '30' }}
                            >
                              <Text 
                                className="text-xs font-semibold capitalize"
                                style={{ color: getDifficultyColor(game.difficulty) }}
                              >
                                {game.difficulty}
                              </Text>
                            </View>
                          </View>
                          
                          <Text className="text-white/70 text-sm leading-5 mb-3">
                            {game.description}
                          </Text>
                          
                          <View className="flex-row items-center justify-between">
                            <Text className="text-white/60 text-xs">
                              {(game.rounds ?? 1)} rounds  b b {game.timeLimit ?? 60}s per round
                            </Text>
                            <Ionicons 
                              name="chevron-forward" 
                              size={16} 
                              color="rgba(255,255,255,0.6)" 
                            />
                          </View>
                        </View>
                      </View>
                      
                      {/* Game Stats */}
                      {syncMetrics.gameTypeStats[game.id as any] && (
                        <View className="mt-4 pt-4 border-t border-white/10">
                          <View className="flex-row justify-between">
                            <Text className="text-white/60 text-xs">
                              Played: {syncMetrics.gameTypeStats[game.id as any].played}
                            </Text>
                            <Text className="text-white/60 text-xs">
                              Success: {Math.round(syncMetrics.gameTypeStats[game.id as any].averageScore)}%
                            </Text>
                          </View>
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </View>
          
          {/* Loading State */}
          {isInviting && (
            <View className="absolute inset-0 bg-black/50 items-center justify-center">
              <View className="bg-white/10 rounded-2xl p-8 items-center backdrop-blur">
                <View className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4" />
                <Text className="text-white text-lg font-semibold">
                  Connecting with your twin...
                </Text>
                <Text className="text-white/70 text-center mt-2">
                  Preparing the psychic channel
                </Text>
              </View>
            </View>
          )}
          
          {/* Bottom Padding */}
          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};