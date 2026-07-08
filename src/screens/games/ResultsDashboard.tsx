/**
 * Results Dashboard - Story 2.10
 * Comprehensive view of all game results with trend analysis
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  Pressable,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useGamesStore, GameType, GameResult } from '../../state/gamesStore';
import { useTwinStore } from '../../state/twinStore';
import CosmicCard from '../../components/common/CosmicCard';
import NeonButton from '../../components/common/NeonButton';
import { ACCENT_COLORS } from '../../theme/colors';

type FilterType = 'all' | GameType;
type DateRange = 'all' | 'week' | 'month';

const GAME_NAMES: Record<GameType, string> = {
  maze: 'Cognitive Maze',
  emotion: 'Emotional Resonance',
  decision: 'Temporal Decision',
  duo: 'Iconic Duo',
};

const GAME_ICONS: Record<GameType, keyof typeof Ionicons.glyphMap> = {
  maze: 'git-network',
  emotion: 'color-palette',
  decision: 'timer',
  duo: 'people',
};

const GAME_COLORS: Record<GameType, keyof typeof ACCENT_COLORS> = {
  maze: 'stellar-blue',
  emotion: 'nebula-rose',
  decision: 'aurora-teal',
  duo: 'solar-amber',
};

export const ResultsDashboard: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    results,
    getOverallSynchronicity,
    getSynchronicityTrend,
    sessions,
  } = useGamesStore();
  const { twinProfile } = useTwinStore();

  const [filterType, setFilterType] = useState<FilterType>('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');

  const overallScore = getOverallSynchronicity();

  // Filter results
  const filteredResults = results.filter((result) => {
    // Type filter
    if (filterType !== 'all' && result.gameType !== filterType) {
      return false;
    }

    // Date filter
    if (dateRange !== 'all') {
      const resultDate = new Date(result.completedAt);
      const now = new Date();
      const diffTime = now.getTime() - resultDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (dateRange === 'week' && diffDays > 7) return false;
      if (dateRange === 'month' && diffDays > 30) return false;
    }

    return true;
  });

  // Sort by date (most recent first)
  const sortedResults = [...filteredResults].sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  // Get trend data
  const trendData = getSynchronicityTrend(filterType === 'all' ? undefined : filterType);

  const renderResultCard = ({ item }: { item: GameResult }) => {
    const gameColor = GAME_COLORS[item.gameType];
    const gameIcon = GAME_ICONS[item.gameType];
    const gameName = GAME_NAMES[item.gameType];

    const date = new Date(item.completedAt);
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <CosmicCard
        elevation={1}
        glowBorder
        accentColor={gameColor}
        style={styles.resultCard}
        testID={`result-card-${item.gameType}`}
      >
        <View style={styles.resultCardContent}>
          {/* Icon */}
          <View
            style={[
              styles.resultIcon,
              { backgroundColor: `${ACCENT_COLORS[gameColor]}22` },
            ]}
          >
            <Ionicons
              name={gameIcon}
              size={24}
              color={ACCENT_COLORS[gameColor]}
            />
          </View>

          {/* Info */}
          <View style={styles.resultInfo}>
            <Text style={styles.resultTitle}>{gameName}</Text>
            <Text style={styles.resultDate}>{formattedDate}</Text>
          </View>

          {/* Score */}
          <View style={styles.resultScore}>
            <Text
              style={[styles.scoreText, { color: ACCENT_COLORS[gameColor] }]}
            >
              {item.synchronicity.overallScore}
            </Text>
            <Text style={styles.scoreLabel}>/100</Text>
          </View>

          {/* View Button */}
          <Pressable
            style={styles.viewButton}
            onPress={() => handleViewDetails(item)}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={ACCENT_COLORS[gameColor]}
            />
          </Pressable>
        </View>
      </CosmicCard>
    );
  };

  const handleViewDetails = (result: GameResult) => {
    // Navigate to specific result screen based on game type
    const routeMap: Record<GameType, string> = {
      maze: 'MazeResults',
      emotion: 'EmotionResults',
      decision: 'DecisionResults',
      duo: 'DuoResults',
    };

    const route = routeMap[result.gameType];
    if (route) {
      navigation.navigate(route, { resultId: result.completedAt });
    }
  };

  const renderEmptyState = () => (
    <CosmicCard elevation={1} style={styles.emptyCard}>
      <View style={styles.emptyContent}>
        <Ionicons name="analytics-outline" size={64} color="#6B7280" />
        <Text style={styles.emptyTitle}>No Results Yet</Text>
        <Text style={styles.emptyText}>
          Play games with your twin to see synchronicity results here!
        </Text>
        <NeonButton
          variant="primary"
          accentColor="stellar-blue"
          onPress={() => navigation.navigate('PsychicGamesHub')}
          style={styles.emptyButton}
        >
          Go to Games
        </NeonButton>
      </View>
    </CosmicCard>
  );

  const renderTrendIndicator = () => {
    if (trendData.length < 2) return null;

    const recent = trendData.slice(-3);
    const isImproving = recent[recent.length - 1] > recent[0];
    const change = Math.abs(recent[recent.length - 1] - recent[0]);

    return (
      <View style={styles.trendIndicator}>
        <Ionicons
          name={isImproving ? 'trending-up' : 'trending-down'}
          size={16}
          color={isImproving ? '#10B981' : '#EF4444'}
        />
        <Text
          style={[
            styles.trendText,
            { color: isImproving ? '#10B981' : '#EF4444' },
          ]}
        >
          {isImproving ? '+' : '-'}
          {change}% recent trend
        </Text>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require('../../../assets/galaxybackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.title}>Results Dashboard</Text>
          <View style={styles.backButton} />
        </View>

        {/* Overall Score Card */}
        <CosmicCard
          elevation={2}
          glowBorder
          accentColor="stellar-blue"
          style={styles.overallCard}
        >
          <View style={styles.overallContent}>
            <Text style={styles.overallLabel}>Overall Synchronicity</Text>
            <Text style={styles.overallScore}>{overallScore}/100</Text>
            {renderTrendIndicator()}
            <Text style={styles.overallSubtext}>
              Based on {results.length} game{results.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </CosmicCard>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {/* Game Type Filters */}
          <Pressable
            style={[
              styles.filterChip,
              filterType === 'all' && styles.filterChipActive,
            ]}
            onPress={() => setFilterType('all')}
          >
            <Text
              style={[
                styles.filterText,
                filterType === 'all' && styles.filterTextActive,
              ]}
            >
              All Games
            </Text>
          </Pressable>

          {(['maze', 'emotion', 'decision', 'duo'] as GameType[]).map(
            (type) => (
              <Pressable
                key={type}
                style={[
                  styles.filterChip,
                  filterType === type && styles.filterChipActive,
                ]}
                onPress={() => setFilterType(type)}
              >
                <Ionicons
                  name={GAME_ICONS[type]}
                  size={16}
                  color={
                    filterType === type ? '#FFFFFF' : ACCENT_COLORS[GAME_COLORS[type]]
                  }
                  style={styles.filterIcon}
                />
                <Text
                  style={[
                    styles.filterText,
                    filterType === type && styles.filterTextActive,
                  ]}
                >
                  {GAME_NAMES[type]}
                </Text>
              </Pressable>
            )
          )}
        </ScrollView>

        {/* Results List */}
        <FlatList
          data={sortedResults}
          renderItem={renderResultCard}
          keyExtractor={(item) => item.completedAt}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  overallCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  overallContent: {
    alignItems: 'center',
    gap: 8,
  },
  overallLabel: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  overallScore: {
    fontSize: 48,
    fontWeight: '700',
    color: ACCENT_COLORS['stellar-blue'],
  },
  overallSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filtersContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#374151',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: ACCENT_COLORS['stellar-blue'],
    borderColor: ACCENT_COLORS['stellar-blue'],
  },
  filterIcon: {
    marginRight: 4,
  },
  filterText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  resultCard: {
    marginBottom: 12,
  },
  resultCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  resultDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  resultScore: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewButton: {
    padding: 4,
  },
  emptyCard: {
    marginTop: 40,
  },
  emptyContent: {
    alignItems: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 8,
  },
});
