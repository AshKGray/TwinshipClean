/**
 * Insights Dashboard Screen
 *
 * Analytics and pattern detection for twincidences.
 *
 * Story: 4-9 Insights and Analytics Dashboard
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTwincidencesStore } from '../../state/twincidencesStore';
import { TwincidenceCategory } from '../../types/twincidences';

const screenWidth = Dimensions.get('window').width;

interface InsightsDashboardProps {
  navigation: any;
}

export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ navigation }) => {
  const { getTwincidenceStats, twincidences } = useTwincidencesStore();
  const stats = getTwincidenceStats();

  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Calculate insights
  const insights = calculateInsights(twincidences, selectedPeriod);

  return (
    <ImageBackground source={require("../../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-row items-center">
            <Pressable onPress={() => navigation.goBack()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <View>
              <Text className="text-white text-2xl font-bold">Insights</Text>
              <Text className="text-white/70 text-sm">Your synchronicity patterns</Text>
            </View>
          </View>

          <Pressable className="bg-white/10 rounded-full p-3 border border-white/20">
            <Ionicons name="share-outline" size={20} color="white" />
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Synchronicity Score */}
          <LinearGradient
            colors={['rgba(138, 43, 226, 0.3)', 'rgba(138, 43, 226, 0.1)']}
            className="rounded-3xl p-6 mb-6 border border-purple-500/40"
          >
            <View className="items-center">
              <Text className="text-white/80 text-base mb-2">Synchronicity Score</Text>
              <View className="relative items-center justify-center mb-4">
                <Text className="text-white text-6xl font-bold">{stats.synchronicityScore}</Text>
                <Text className="text-purple-400 text-sm absolute -bottom-6">/100</Text>
              </View>
              <Text className="text-white/60 text-sm text-center mt-6">
                Based on frequency, consistency, and variety of synchronicities
              </Text>
            </View>
          </LinearGradient>

          {/* Period Selector */}
          <View className="flex-row items-center justify-center mb-6 space-x-3">
            {(['week', 'month', 'year'] as const).map((period) => (
              <Pressable
                key={period}
                onPress={() => setSelectedPeriod(period)}
                className={`rounded-full px-6 py-2 ${
                  selectedPeriod === period
                    ? 'bg-purple-500'
                    : 'bg-white/10 border border-white/20'
                }`}
              >
                <Text
                  className={`font-semibold capitalize ${
                    selectedPeriod === period ? 'text-white' : 'text-white/60'
                  }`}
                >
                  {period}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Key Metrics Grid */}
          <View className="flex-row flex-wrap mb-6">
            <MetricCard
              icon="sparkles"
              label="Total"
              value={stats.totalTwincidences}
              color="#8A2BE2"
            />
            <MetricCard
              icon="flame"
              label="Current Streak"
              value={`${stats.currentStreak} days`}
              color="#FF4500"
            />
            <MetricCard
              icon="trophy"
              label="Longest Streak"
              value={`${stats.longestStreak} days`}
              color="#FFD700"
            />
            <MetricCard
              icon="calendar"
              label="This Week"
              value={stats.twincidencesThisWeek}
              color="#32CD32"
            />
          </View>

          {/* Category Breakdown */}
          <View className="mb-6">
            <Text className="text-white font-semibold text-lg mb-3">Category Breakdown</Text>
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              className="rounded-2xl p-4 border border-white/20"
            >
              {stats.topCategories.map((item, index) => (
                <CategoryRow
                  key={item.category}
                  category={item.category}
                  count={item.count}
                  total={stats.totalTwincidences}
                  rank={index + 1}
                />
              ))}

              {stats.topCategories.length === 0 && (
                <Text className="text-white/60 text-center py-4">
                  No twincidences yet
                </Text>
              )}
            </LinearGradient>
          </View>

          {/* Detection Types */}
          <View className="mb-6">
            <Text className="text-white font-semibold text-lg mb-3">Detection Types</Text>
            <View className="flex-row space-x-3">
              <DetectionTypeCard
                label="Auto-Detected"
                count={stats.automatedCount}
                percentage={stats.totalTwincidences > 0 ? (stats.automatedCount / stats.totalTwincidences) * 100 : 0}
                color="#32CD32"
                icon="flash"
              />
              <DetectionTypeCard
                label="Manual Entries"
                count={stats.manualCount}
                percentage={stats.totalTwincidences > 0 ? (stats.manualCount / stats.totalTwincidences) * 100 : 0}
                color="#FF69B4"
                icon="create"
              />
            </View>
          </View>

          {/* Confidence Score (for automated) */}
          {stats.automatedCount > 0 && (
            <View className="mb-6">
              <Text className="text-white font-semibold text-lg mb-3">Detection Quality</Text>
              <LinearGradient
                colors={['rgba(50, 205, 50, 0.2)', 'rgba(50, 205, 50, 0.1)']}
                className="rounded-2xl p-4 border border-green-500/40"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white text-base">Average Confidence</Text>
                  <Text className="text-green-400 text-xl font-bold">
                    {Math.round(stats.averageConfidenceScore * 100)}%
                  </Text>
                </View>
                <View className="bg-white/20 rounded-full h-3 overflow-hidden">
                  <View
                    className="h-full bg-green-400 rounded-full"
                    style={{ width: `${stats.averageConfidenceScore * 100}%` }}
                  />
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Insights & Patterns */}
          <View className="mb-6">
            <Text className="text-white font-semibold text-lg mb-3">Patterns Detected</Text>
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}

            {insights.length === 0 && (
              <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                className="rounded-2xl p-6 border border-white/10"
              >
                <View className="items-center">
                  <Ionicons name="search" size={48} color="rgba(255,255,255,0.3)" />
                  <Text className="text-white/60 text-center mt-3">
                    Keep logging twincidences to discover patterns
                  </Text>
                </View>
              </LinearGradient>
            )}
          </View>

          <View className="pb-8" />
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  icon: string;
  label: string;
  value: string | number;
  color: string;
}> = ({ icon, label, value, color }) => (
  <View className="w-1/2 p-1.5">
    <LinearGradient
      colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
      className="rounded-2xl p-4 border border-white/20"
    >
      <View className="flex-row items-center mb-2">
        <View
          className="rounded-full p-2 mr-2"
          style={{ backgroundColor: color + '30' }}
        >
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <Text className="text-white/70 text-sm flex-1">{label}</Text>
      </View>
      <Text className="text-white text-2xl font-bold">{value}</Text>
    </LinearGradient>
  </View>
);

// Category Row Component
const CategoryRow: React.FC<{
  category: TwincidenceCategory;
  count: number;
  total: number;
  rank: number;
}> = ({ category, count, total, rank }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const categoryInfo = getCategoryInfo(category);

  return (
    <View className="mb-4 last:mb-0">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <Text className="text-white/40 text-sm mr-2 w-6">#{rank}</Text>
          <Ionicons name={categoryInfo.icon as any} size={16} color={categoryInfo.color} />
          <Text className="text-white text-sm ml-2 flex-1" numberOfLines={1}>
            {categoryInfo.label}
          </Text>
        </View>
        <Text className="text-white font-semibold ml-2">{count}</Text>
      </View>
      <View className="bg-white/10 rounded-full h-2 overflow-hidden ml-8">
        <View
          className="h-full rounded-full"
          style={{ width: `${percentage}%`, backgroundColor: categoryInfo.color }}
        />
      </View>
    </View>
  );
};

// Detection Type Card Component
const DetectionTypeCard: React.FC<{
  label: string;
  count: number;
  percentage: number;
  color: string;
  icon: string;
}> = ({ label, count, percentage, color, icon }) => (
  <View className="flex-1">
    <LinearGradient
      colors={[color + '20', color + '10']}
      className="rounded-2xl p-4 border border-opacity-40"
      style={{ borderColor: color }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <Ionicons name={icon as any} size={24} color={color} />
        <Text className="text-white text-2xl font-bold">{count}</Text>
      </View>
      <Text className="text-white text-sm mb-1">{label}</Text>
      <Text className="text-white/60 text-xs">{percentage.toFixed(0)}%</Text>
    </LinearGradient>
  </View>
);

// Insight Card Component
const InsightCard: React.FC<{ insight: any }> = ({ insight }) => {
  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case 'high':
        return '#FF1493';
      case 'medium':
        return '#FFD700';
      case 'low':
        return '#32CD32';
      default:
        return '#8A2BE2';
    }
  };

  const color = getSignificanceColor(insight.significance);

  return (
    <LinearGradient
      colors={[color + '20', color + '10']}
      className="rounded-2xl p-4 mb-3 border border-opacity-40"
      style={{ borderColor: color }}
    >
      <View className="flex-row items-start">
        <View
          className="rounded-full p-2 mr-3"
          style={{ backgroundColor: color + '30' }}
        >
          <Ionicons
            name={insight.type === 'pattern' ? 'analytics' : insight.type === 'milestone' ? 'trophy' : 'trending-up'}
            size={20}
            color={color}
          />
        </View>
        <View className="flex-1">
          <Text className="text-white font-semibold text-base mb-1">{insight.title}</Text>
          <Text className="text-white/70 text-sm leading-5">{insight.description}</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

// Helper function to get category info
const getCategoryInfo = (category: TwincidenceCategory) => {
  const categoryMap: Record<TwincidenceCategory, { icon: string; label: string; color: string }> = {
    [TwincidenceCategory.TWINTUITION_SYNC]: { icon: 'flash', label: 'Twintuition Sync', color: '#FF1493' },
    [TwincidenceCategory.BIOMETRIC_SYNC]: { icon: 'heart-circle', label: 'Biometric Sync', color: '#FF4500' },
    [TwincidenceCategory.LOCATION_COINCIDENCE]: { icon: 'location', label: 'Location', color: '#32CD32' },
    [TwincidenceCategory.DIGITAL_BEHAVIOR]: { icon: 'phone-portrait', label: 'Digital Behavior', color: '#1E90FF' },
    [TwincidenceCategory.COMMUNICATION_PATTERN]: { icon: 'chatbubbles', label: 'Communication', color: '#8A2BE2' },
    [TwincidenceCategory.ENVIRONMENTAL_MATCHING]: { icon: 'partly-sunny', label: 'Environmental', color: '#FFD700' },
    [TwincidenceCategory.MANUAL_ESP]: { icon: 'eye', label: 'ESP / Telepathy', color: '#9370DB' },
    [TwincidenceCategory.MANUAL_DREAM]: { icon: 'moon', label: 'Shared Dream', color: '#4B0082' },
    [TwincidenceCategory.MANUAL_TWIN_TALK]: { icon: 'people', label: 'Twin-Talk', color: '#FF69B4' },
    [TwincidenceCategory.MANUAL_PARALLEL_EXPERIENCE]: { icon: 'git-compare', label: 'Parallel Experience', color: '#20B2AA' },
    [TwincidenceCategory.MANUAL_OTHER]: { icon: 'sparkles', label: 'Other', color: '#DDA0DD' },
  };

  return categoryMap[category] || { icon: 'sparkles', label: 'Unknown', color: '#8A2BE2' };
};

// Calculate insights from twincidences
const calculateInsights = (twincidences: any[], period: 'week' | 'month' | 'year') => {
  const insights: any[] = [];

  if (twincidences.length === 0) {
    return insights;
  }

  // Pattern: High frequency in a specific category
  const categoryCounts: Record<string, number> = {};
  twincidences.forEach((t) => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });

  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
  if (topCategory && topCategory[1] >= 5) {
    const categoryInfo = getCategoryInfo(topCategory[0] as TwincidenceCategory);
    insights.push({
      id: 'pattern-1',
      type: 'pattern',
      title: `${categoryInfo.label} Pattern`,
      description: `You have ${topCategory[1]} ${categoryInfo.label.toLowerCase()} synchronicities. This category is particularly strong in your twin connection.`,
      significance: topCategory[1] >= 10 ? 'high' : 'medium',
    });
  }

  // Milestone: Total count achievements
  if (twincidences.length >= 50) {
    insights.push({
      id: 'milestone-1',
      type: 'milestone',
      title: '50+ Synchronicities!',
      description: 'You\'ve documented over 50 synchronicities with your twin. Your connection is incredibly well-documented!',
      significance: 'high',
    });
  } else if (twincidences.length >= 25) {
    insights.push({
      id: 'milestone-2',
      type: 'milestone',
      title: '25+ Synchronicities',
      description: 'You\'ve reached 25 documented synchronicities. Keep tracking to discover more patterns!',
      significance: 'medium',
    });
  } else if (twincidences.length >= 10) {
    insights.push({
      id: 'milestone-3',
      type: 'milestone',
      title: 'First 10 Synchronicities',
      description: 'Great start! You\'ve documented 10 synchronicities. The more you track, the more patterns you\'ll discover.',
      significance: 'low',
    });
  }

  // Trend: Recent activity
  const now = Date.now();
  const recentPeriod = period === 'week' ? 7 : period === 'month' ? 30 : 365;
  const recentCount = twincidences.filter(
    (t) => now - new Date(t.timestamp).getTime() < recentPeriod * 24 * 60 * 60 * 1000
  ).length;

  if (recentCount >= twincidences.length * 0.5) {
    insights.push({
      id: 'trend-1',
      type: 'trend',
      title: 'Active Period',
      description: `You've logged ${recentCount} synchronicities this ${period}. Your twin connection is particularly active right now!`,
      significance: 'high',
    });
  }

  return insights;
};
