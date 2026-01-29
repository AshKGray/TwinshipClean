/**
 * Research Contribution Leaderboard Screen
 * Story: 5-5 Research Contribution Leaderboard (Optional)
 *
 * Gamifies research participation with leaderboards and badges
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ImageBackground, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useResearchStore } from '../../state/researchStore';
import { useTwinStore } from '../../state/twinStore';
import { researchDataService, LeaderboardEntry } from '../../services/researchDataService';

export const LeaderboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { userProfile } = useTwinStore();
  const { participation } = useResearchStore();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [userProfile, participation]);

  const loadLeaderboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setIsLoading(true);

    if (!userProfile || !participation?.activeStudies.length) {
      setIsLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const studyId = participation.activeStudies[0];
      const entries = await researchDataService.getContributionLeaderboard(studyId, 50);

      setLeaderboard(entries);

      // Get user's anonymous ID and find their entry
      const anonymousId = await researchDataService.generateAnonymousId(
        userProfile.id,
        studyId
      );
      const myEntry = entries.find(e => e.anonymousId === anonymousId);
      setUserEntry(myEntry || null);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadLeaderboard(true);
  };

  const getRankColor = (rank: number): string => {
    if (rank === 1) return '#fbbf24'; // gold
    if (rank === 2) return '#9ca3af'; // silver
    if (rank === 3) return '#d97706'; // bronze
    return '#8b5cf6'; // purple
  };

  const getRankIcon = (rank: number): string => {
    if (rank === 1) return 'trophy';
    if (rank === 2) return 'medal';
    if (rank === 3) return 'ribbon';
    return 'star';
  };

  const getBadgeIcon = (badge: string): string => {
    const badgeMap: Record<string, string> = {
      'Research Pioneer': 'telescope',
      'Data Dynamo': 'flash',
      'Consistency King': 'checkmark-done',
      'Diversity Champion': 'grid',
      'Top Contributor': 'trophy',
      'Rising Star': 'trending-up',
      'Veteran Researcher': 'shield',
    };
    return badgeMap[badge] || 'ribbon';
  };

  const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number) => {
    const isUser = entry.anonymousId === userEntry?.anonymousId;

    return (
      <View
        key={entry.anonymousId}
        className={`rounded-xl p-4 mb-3 ${
          isUser
            ? 'bg-purple-500/30 border-2 border-purple-400'
            : 'bg-white/10'
        }`}
      >
        <View className="flex-row items-center">
          {/* Rank */}
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: getRankColor(entry.rank) + '33' }}
          >
            <Ionicons
              name={getRankIcon(entry.rank) as any}
              size={24}
              color={getRankColor(entry.rank)}
            />
          </View>

          {/* Info */}
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className="text-white font-bold text-lg">#{entry.rank}</Text>
              <Text className="text-white/70 text-sm ml-2">
                {isUser ? 'You' : entry.displayName}
              </Text>
              {isUser && (
                <View className="bg-purple-500 px-2 py-0.5 rounded ml-2">
                  <Text className="text-white text-xs font-semibold">YOU</Text>
                </View>
              )}
            </View>

            <View className="flex-row items-center space-x-4">
              <View className="flex-row items-center">
                <Ionicons name="flash" size={14} color="rgba(255,255,255,0.7)" />
                <Text className="text-white/70 text-sm ml-1">
                  {entry.contributionScore} pts
                </Text>
              </View>

              <View className="flex-row items-center">
                <Ionicons name="document" size={14} color="rgba(255,255,255,0.7)" />
                <Text className="text-white/70 text-sm ml-1">
                  {entry.dataPointsSubmitted}
                </Text>
              </View>

              <View className="flex-row items-center">
                <Ionicons name="grid" size={14} color="rgba(255,255,255,0.7)" />
                <Text className="text-white/70 text-sm ml-1">
                  {entry.dataTypesCount} types
                </Text>
              </View>
            </View>

            {/* Badges */}
            {entry.badges.length > 0 && (
              <View className="flex-row flex-wrap gap-1 mt-2">
                {entry.badges.map((badge) => (
                  <View
                    key={badge}
                    className="bg-amber-500/20 px-2 py-0.5 rounded-full flex-row items-center"
                  >
                    <Ionicons
                      name={getBadgeIcon(badge) as any}
                      size={10}
                      color="#fbbf24"
                    />
                    <Text className="text-amber-300 text-xs ml-1">{badge}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Score Bar */}
          <View className="w-16">
            <View className="h-2 bg-white/20 rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${Math.min((entry.contributionScore / 1000) * 100, 100)}%`,
                  backgroundColor: getRankColor(entry.rank),
                }}
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <ImageBackground source={require("../../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 justify-center items-center">
          <View className="bg-white/10 rounded-xl p-8">
            <Text className="text-white text-lg text-center">Loading leaderboard...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (!participation?.activeStudies.length) {
    return (
      <ImageBackground source={require("../../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          <View className="p-6 flex-1 justify-center">
            <View className="bg-white/10 rounded-xl p-8">
              <Ionicons name="trophy" size={64} color="rgba(255,255,255,0.5)" style={{ alignSelf: 'center', marginBottom: 16 }} />
              <Text className="text-white text-xl font-bold text-center mb-4">
                No Active Studies
              </Text>
              <Text className="text-white/70 text-center mb-6">
                Join a research study to compete on the leaderboard.
              </Text>
              <Pressable
                onPress={() => navigation.navigate('ResearchParticipationScreen' as never)}
                className="bg-purple-500 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold text-center">Browse Studies</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require("../../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1 px-6"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#ffffff" />
          }
        >
          {/* Header */}
          <View className="py-6">
            <Text className="text-white text-3xl font-bold text-center mb-2">
              Contribution Leaderboard
            </Text>
            <Text className="text-white/70 text-center text-lg">
              Top research contributors
            </Text>
          </View>

          {/* User's Rank Card */}
          {userEntry && (
            <View className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-xl p-6 mb-6">
              <Text className="text-white text-lg font-semibold mb-4">Your Rank</Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white/70 text-sm mb-1">Current Rank</Text>
                  <Text className="text-white font-bold text-4xl">#{userEntry.rank}</Text>
                </View>

                <View className="flex-1">
                  <Text className="text-white/70 text-sm mb-1">Contribution Score</Text>
                  <Text className="text-purple-300 font-bold text-4xl">
                    {userEntry.contributionScore}
                  </Text>
                </View>
              </View>

              <View className="bg-white/10 rounded-lg p-3 mt-4">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-white/70 text-sm">Data Points</Text>
                  <Text className="text-white font-semibold">
                    {userEntry.dataPointsSubmitted}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-white/70 text-sm">Data Types</Text>
                  <Text className="text-white font-semibold">
                    {userEntry.dataTypesCount}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-white/70 text-sm">Consistency</Text>
                  <Text className="text-white font-semibold">
                    {userEntry.consistencyScore}%
                  </Text>
                </View>
              </View>

              {userEntry.badges.length > 0 && (
                <View className="mt-4">
                  <Text className="text-white/70 text-sm mb-2">Your Badges</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {userEntry.badges.map((badge) => (
                      <View
                        key={badge}
                        className="bg-amber-500/20 px-3 py-1.5 rounded-full flex-row items-center"
                      >
                        <Ionicons
                          name={getBadgeIcon(badge) as any}
                          size={16}
                          color="#fbbf24"
                        />
                        <Text className="text-amber-300 text-sm ml-1.5">{badge}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Leaderboard */}
          <View className="mb-6">
            <Text className="text-white text-xl font-semibold mb-4">Top Contributors</Text>

            {leaderboard.length === 0 ? (
              <View className="bg-white/10 rounded-xl p-8">
                <Text className="text-white/70 text-center">
                  Leaderboard will populate as more twins contribute data
                </Text>
              </View>
            ) : (
              leaderboard.map((entry, index) => renderLeaderboardEntry(entry, index))
            )}
          </View>

          {/* How Scoring Works */}
          <View className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={24} color="#60a5fa" />
              <View className="flex-1 ml-3">
                <Text className="text-blue-300 font-semibold mb-2">How Scoring Works</Text>
                <Text className="text-white/80 text-sm leading-5">
                  • 10 points per data submission{'\n'}
                  • 20 bonus points per unique data type{'\n'}
                  • 5 points for consistency (submissions in last 30 days){'\n'}
                  • Badges awarded for milestones and achievements
                </Text>
              </View>
            </View>
          </View>

          {/* Available Badges */}
          <View className="bg-white/10 rounded-xl p-4 mb-8">
            <Text className="text-white font-semibold mb-3">Available Badges</Text>
            <View className="space-y-2">
              {[
                { name: 'Research Pioneer', desc: 'First 100 contributors', icon: 'telescope' },
                { name: 'Data Dynamo', desc: '100+ data points submitted', icon: 'flash' },
                { name: 'Consistency King', desc: '30-day contribution streak', icon: 'checkmark-done' },
                { name: 'Diversity Champion', desc: 'All 5 data types submitted', icon: 'grid' },
                { name: 'Top Contributor', desc: 'Top 10 on leaderboard', icon: 'trophy' },
              ].map((badge) => (
                <View key={badge.name} className="flex-row items-center py-2">
                  <View className="bg-amber-500/20 rounded-full p-2 mr-3">
                    <Ionicons name={badge.icon as any} size={16} color="#fbbf24" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-medium">{badge.name}</Text>
                    <Text className="text-white/60 text-xs">{badge.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};
