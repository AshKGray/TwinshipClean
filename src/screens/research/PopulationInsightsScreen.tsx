/**
 * Population Insights Screen
 * Story: 5-4 Population Insights Dashboard
 *
 * Shows aggregate statistics comparing user to twin population
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useResearchStore } from '../../state/researchStore';
import { useTwinStore } from '../../state/twinStore';
import { researchDataService, PopulationInsight } from '../../services/researchDataService';

export const PopulationInsightsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { userProfile } = useTwinStore();
  const { participation } = useResearchStore();

  const [insights, setInsights] = useState<PopulationInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, [userProfile, participation]);

  const loadInsights = async () => {
    if (!userProfile || !participation?.activeStudies.length) {
      setIsLoading(false);
      return;
    }

    try {
      const studyId = participation.activeStudies[0];
      const populationInsights = await researchDataService.getPopulationInsights(
        studyId,
        userProfile.id
      );

      setInsights(populationInsights);
    } catch (error) {
      console.error('Error loading population insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPercentileColor = (percentile: number): string => {
    if (percentile >= 90) return '#10b981'; // green
    if (percentile >= 75) return '#3b82f6'; // blue
    if (percentile >= 50) return '#f59e0b'; // orange
    return '#6b7280'; // gray
  };

  const getPercentileLabel = (percentile: number): string => {
    if (percentile >= 90) return 'Top 10%';
    if (percentile >= 75) return 'Top 25%';
    if (percentile >= 50) return 'Above Average';
    if (percentile >= 25) return 'Average';
    return 'Below Average';
  };

  const renderMetricCard = (metric: PopulationInsight['metrics'][0]) => {
    const color = getPercentileColor(metric.percentile);
    const label = getPercentileLabel(metric.percentile);

    return (
      <View key={metric.name} className="bg-white/10 rounded-xl p-4 mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-white font-semibold flex-1">{metric.name}</Text>
          <View className="bg-white/20 px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-medium">{label}</Text>
          </View>
        </View>

        <View className="space-y-3">
          {/* Your Value */}
          <View>
            <Text className="text-white/70 text-sm mb-1">Your Score</Text>
            <View className="flex-row items-center">
              <View className="flex-1 bg-white/20 rounded-full h-2 mr-3">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min((metric.userValue / 100) * 100, 100)}%`,
                    backgroundColor: color,
                  }}
                />
              </View>
              <Text className="text-white font-bold">{metric.userValue.toFixed(1)}</Text>
            </View>
          </View>

          {/* Population Mean */}
          <View>
            <Text className="text-white/70 text-sm mb-1">Population Average</Text>
            <View className="flex-row items-center">
              <View className="flex-1 bg-white/20 rounded-full h-2 mr-3">
                <View
                  className="h-full bg-blue-400 rounded-full"
                  style={{ width: `${Math.min((metric.populationMean / 100) * 100, 100)}%` }}
                />
              </View>
              <Text className="text-white font-bold">{metric.populationMean.toFixed(1)}</Text>
            </View>
          </View>

          {/* Percentile */}
          <View className="bg-white/5 rounded-lg p-3 mt-2">
            <Text className="text-white/70 text-sm mb-1">Your Percentile</Text>
            <View className="flex-row items-center">
              <View className="flex-1 bg-white/20 rounded-full h-3">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${metric.percentile}%`,
                    backgroundColor: color,
                  }}
                />
              </View>
              <Text className="text-white font-bold text-lg ml-3">
                {metric.percentile}%
              </Text>
            </View>
            <Text className="text-white/60 text-xs mt-2">
              You score higher than {metric.percentile}% of twin pairs
            </Text>
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
            <Text className="text-white text-lg text-center">Loading insights...</Text>
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
              <Ionicons name="bar-chart" size={64} color="rgba(255,255,255,0.5)" style={{ alignSelf: 'center', marginBottom: 16 }} />
              <Text className="text-white text-xl font-bold text-center mb-4">
                No Active Studies
              </Text>
              <Text className="text-white/70 text-center mb-6">
                Join a research study to access population insights.
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
        <ScrollView className="flex-1 px-6">
          {/* Header */}
          <View className="py-6">
            <Text className="text-white text-3xl font-bold text-center mb-2">
              Population Insights
            </Text>
            <Text className="text-white/70 text-center text-lg">
              Compare your metrics to other twin pairs
            </Text>
          </View>

          {insights.length === 0 ? (
            <View className="bg-white/10 rounded-xl p-8 mb-6">
              <Ionicons name="time" size={48} color="rgba(255,255,255,0.5)" style={{ alignSelf: 'center', marginBottom: 16 }} />
              <Text className="text-white text-center mb-2">
                Insights Coming Soon
              </Text>
              <Text className="text-white/70 text-center text-sm">
                Population insights will appear here as research data is analyzed. Keep contributing to see how you compare!
              </Text>
            </View>
          ) : (
            insights.map((insight) => (
              <View key={insight.id} className="mb-6">
                <View className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-6 mb-4">
                  <Text className="text-white text-2xl font-bold mb-2">{insight.title}</Text>
                  <Text className="text-white/80 mb-4">{insight.description}</Text>
                  <View className="flex-row items-center">
                    <Ionicons name="people" size={16} color="rgba(255,255,255,0.7)" />
                    <Text className="text-white/70 text-sm ml-2">
                      Based on {insight.sampleSize.toLocaleString()} twin pairs
                    </Text>
                  </View>
                  <Text className="text-white/50 text-xs mt-2">
                    Last updated: {new Date(insight.lastUpdated).toLocaleDateString()}
                  </Text>
                </View>

                {insight.metrics.map(renderMetricCard)}
              </View>
            ))
          )}

          {/* Mock Data Example (for development) */}
          {insights.length === 0 && (
            <View className="mb-6">
              <Text className="text-white text-xl font-semibold mb-4">Example Insights</Text>
              <Text className="text-white/70 text-sm mb-4">
                These are sample insights showing how population comparisons will appear:
              </Text>

              {[
                {
                  name: 'Twin Synchronicity Score',
                  userValue: 78,
                  populationMean: 62,
                  populationStdDev: 15,
                  percentile: 82,
                },
                {
                  name: 'Twintuition Alert Frequency',
                  userValue: 45,
                  populationMean: 52,
                  populationStdDev: 12,
                  percentile: 43,
                },
                {
                  name: 'Game Performance Average',
                  userValue: 85,
                  populationMean: 71,
                  populationStdDev: 10,
                  percentile: 91,
                },
              ].map(renderMetricCard)}
            </View>
          )}

          {/* Privacy Notice */}
          <View className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={24} color="#60a5fa" />
              <View className="flex-1 ml-3">
                <Text className="text-blue-300 font-semibold mb-2">Privacy Note</Text>
                <Text className="text-white/80 text-sm leading-5">
                  All insights are based on fully anonymized data from participating twin pairs. Individual data cannot be identified.
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View className="mb-8 space-y-3">
            <Pressable
              onPress={() => navigation.navigate('ContributionTrackingScreen' as never)}
              className="bg-purple-500 py-4 rounded-xl"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="stats-chart" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">
                  View My Contributions
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('LeaderboardScreen' as never)}
              className="bg-white/20 py-4 rounded-xl"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="trophy" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">
                  Contribution Leaderboard
                </Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};
