/**
 * Psychic Games Hub Screen - Story 2.1
 * Central hub for all 4 psychic games with completion tracking
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useGamesStore } from '../../state/gamesStore';
import { useTwinStore } from '../../state/twinStore';
import CosmicCard from '../../components/common/CosmicCard';
import NeonButton from '../../components/common/NeonButton';
import { ACCENT_COLORS } from '../../theme/colors';

type GameInfo = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  accentColor: keyof typeof ACCENT_COLORS;
};

const GAMES: GameInfo[] = [
  {
    id: 'maze',
    title: 'Cognitive Synchrony Maze',
    description: 'Navigate mazes and discover your problem-solving sync',
    icon: 'git-network',
    route: 'CognitiveSyncMaze',
    accentColor: 'stellar-blue',
  },
  {
    id: 'emotion',
    title: 'Emotional Resonance Mapping',
    description: 'Match emotions to abstract images and compare vocabularies',
    icon: 'color-palette',
    route: 'EmotionalResonanceMapping',
    accentColor: 'nebula-rose',
  },
  {
    id: 'decision',
    title: 'Temporal Decision Synchrony',
    description: 'Make rapid decisions and reveal your value alignment',
    icon: 'timer',
    route: 'TemporalDecisionSync',
    accentColor: 'aurora-teal',
  },
  {
    id: 'duo',
    title: 'Iconic Duo Quiz',
    description: 'Discover which famous twin duo you resemble',
    icon: 'people',
    route: 'IconicDuoMatcher',
    accentColor: 'solar-amber',
  },
];

export const PsychicGamesHub: React.FC = () => {
  const navigation = useNavigation<any>();
  const { getCompletionStatus, getOverallSynchronicity } = useGamesStore();
  const { userProfile, twinProfile } = useTwinStore();

  const completionStatus = getCompletionStatus();
  const overallScore = getOverallSynchronicity();
  const completedCount = Object.values(completionStatus).filter(Boolean).length;
  const completionPercentage = Math.round((completedCount / 4) * 100);

  const handleGamePress = (route: string, gameId: string) => {
    navigation.navigate(route);
  };

  const handleResultsPress = () => {
    navigation.navigate('ResultsDashboard');
  };

  const isGameCompleted = (gameId: string): boolean => {
    return completionStatus[gameId as keyof typeof completionStatus] || false;
  };

  return (
    <ImageBackground
      source={require('../../../assets/galaxybackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.title}>Psychic Games</Text>
            <View style={styles.backButton} />
          </View>

          {/* Overall Progress Card */}
          <CosmicCard
            elevation={2}
            glowBorder
            accentColor="stellar-blue"
            style={styles.progressCard}
            testID="progress-card"
          >
            <View style={styles.progressContent}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Twin Synchronicity</Text>
                {overallScore > 0 && (
                  <Text style={styles.progressScore}>{overallScore}/100</Text>
                )}
              </View>

              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${completionPercentage}%`,
                        backgroundColor: ACCENT_COLORS['stellar-blue'],
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {completedCount}/4 games completed
                </Text>
              </View>

              {completedCount > 0 && (
                <NeonButton
                  variant="outline"
                  size="small"
                  accentColor="stellar-blue"
                  onPress={handleResultsPress}
                  fullWidth
                  testID="view-results-button"
                >
                  View All Results
                </NeonButton>
              )}
            </View>
          </CosmicCard>

          {/* Games Grid */}
          <View style={styles.gamesGrid}>
            {GAMES.map((game) => {
              const isCompleted = isGameCompleted(game.id);

              return (
                <CosmicCard
                  key={game.id}
                  elevation={1}
                  glowBorder={isCompleted}
                  accentColor={game.accentColor}
                  onPress={() => handleGamePress(game.route, game.id)}
                  style={styles.gameCard}
                  testID={`game-card-${game.id}`}
                >
                  <View style={styles.gameCardContent}>
                    {/* Completion Badge */}
                    {isCompleted && (
                      <View
                        style={[
                          styles.completionBadge,
                          { backgroundColor: ACCENT_COLORS[game.accentColor] },
                        ]}
                      >
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      </View>
                    )}

                    {/* Game Icon */}
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: `${ACCENT_COLORS[game.accentColor]}22` },
                      ]}
                    >
                      <Ionicons
                        name={game.icon}
                        size={36}
                        color={ACCENT_COLORS[game.accentColor]}
                      />
                    </View>

                    {/* Game Info */}
                    <Text style={styles.gameTitle}>{game.title}</Text>
                    <Text style={styles.gameDescription}>{game.description}</Text>

                    {/* Play Button */}
                    <View style={styles.playButtonContainer}>
                      <Text
                        style={[
                          styles.playButton,
                          { color: ACCENT_COLORS[game.accentColor] },
                        ]}
                      >
                        {isCompleted ? 'Play Again' : 'Play'}
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color={ACCENT_COLORS[game.accentColor]}
                      />
                    </View>
                  </View>
                </CosmicCard>
              );
            })}
          </View>

          {/* Empty State or Info */}
          {completedCount === 0 && (
            <CosmicCard elevation={1} style={styles.infoCard}>
              <View style={styles.infoContent}>
                <Ionicons name="information-circle" size={48} color="#6B7280" />
                <Text style={styles.infoTitle}>Welcome to Psychic Games!</Text>
                <Text style={styles.infoText}>
                  Play these scientifically designed games with your twin to measure and
                  explore different aspects of your connection. Each game reveals unique
                  insights about your synchronicity.
                </Text>
                {twinProfile && (
                  <Text style={styles.infoText}>
                    Complete games to compare results with {twinProfile.name}!
                  </Text>
                )}
              </View>
            </CosmicCard>
          )}
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  progressCard: {
    marginBottom: 24,
  },
  progressContent: {
    gap: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressScore: {
    fontSize: 24,
    fontWeight: '700',
    color: ACCENT_COLORS['stellar-blue'],
  },
  progressBarContainer: {
    gap: 8,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  gamesGrid: {
    gap: 16,
  },
  gameCard: {
    marginBottom: 8,
  },
  gameCardContent: {
    gap: 12,
  },
  completionBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  gameDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  playButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  playButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    marginTop: 16,
  },
  infoContent: {
    alignItems: 'center',
    gap: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
