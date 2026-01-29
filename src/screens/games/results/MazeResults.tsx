/**
 * Maze Results Screen
 * Displays cognitive synchrony insights from completed maze sessions
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, {
  FadeInDown,
  FadeInUp,
  withSpring,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '@/theme/haptics';
import { GalaxyBackground, CosmicCard, NeonButton } from '@/components/common';
import { useGamesStore } from '@/state/gamesStore';
import { mazeAnalysisService } from '@/services/games/mazeAnalysis';
import type { MazeResult, MazeData } from '@/state/gamesStore';

type RootStackParamList = {
  MazeResults: { sessionId: string };
  PsychicGamesHub: undefined;
  ResultsDashboard: { gameType?: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'MazeResults'>;

interface DirectionStat {
  direction: string;
  percentage: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export const MazeResults: React.FC<Props> = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const [result, setResult] = useState<MazeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const getSessionById = useGamesStore((state) => state.getSessionById);

  useEffect(() => {
    loadResults();
  }, [sessionId]);

  const loadResults = async () => {
    try {
      const session = getSessionById(sessionId);
      if (!session || session.gameType !== 'maze') {
        Alert.alert('Error', 'Session not found');
        navigation.goBack();
        return;
      }

      // If result already exists in session, use it
      if (session.result && session.result.gameType === 'maze') {
        setResult(session.result as MazeResult);
      } else {
        // Generate result (for single player)
        const mazeData = session.rawData as MazeData;
        const prefs = mazeAnalysisService.calculateDirectionPreferences(mazeData.moves);
        const errorAnalysis = mazeAnalysisService.analyzeErrorPatterns(
          mazeData.moves,
          mazeData.completionTime
        );

        const generatedResult: MazeResult = {
          gameType: 'maze',
          completedAt: session.completedAt || new Date().toISOString(),
          directionPreferences: prefs,
          errorRate: errorAnalysis.errorRate,
          synchronicity: {
            directionAlignment: 0,
            errorStyleMatch: 0,
            overallScore: 0,
          },
          insights: [
            `You completed the maze in ${Math.round(mazeData.completionTime / 1000)}s with ${mazeData.errorCount} errors.`,
            `Your dominant direction preference is ${Object.entries(prefs).reduce((a, b) => (b[1] > a[1] ? b : a))[0]}.`,
            `Error correction style: ${errorAnalysis.correctionStyle}`,
          ],
          shareable: true,
        };

        setResult(generatedResult);
      }
    } catch (error) {
      console.error('Failed to load maze results:', error);
      Alert.alert('Error', 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!result) return;

    triggerHaptic('success');
    try {
      await Share.share({
        message: `Twinship Maze Results\n\nCognitive Synchrony: ${result.synchronicity.overallScore}%\n${result.insights[0]}`,
        title: 'My Maze Results',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handlePlayAgain = () => {
    triggerHaptic('medium');
    navigation.navigate('PsychicGamesHub');
  };

  const handleViewAll = () => {
    triggerHaptic('light');
    navigation.navigate('ResultsDashboard', { gameType: 'maze' });
  };

  if (loading) {
    return (
      <GalaxyBackground intensity="vibrant" animated>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Analyzing cognitive patterns...</Text>
          </View>
        </SafeAreaView>
      </GalaxyBackground>
    );
  }

  if (!result) {
    return (
      <GalaxyBackground intensity="vibrant" animated>
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No results available</Text>
            <NeonButton onPress={() => navigation.goBack()} accentColor="cosmic-pink">
              Go Back
            </NeonButton>
          </View>
        </SafeAreaView>
      </GalaxyBackground>
    );
  }

  const directionStats: DirectionStat[] = [
    {
      direction: 'Up',
      percentage: result.directionPreferences.up,
      icon: 'arrow-up-circle',
      color: '#00E5FF',
    },
    {
      direction: 'Down',
      percentage: result.directionPreferences.down,
      icon: 'arrow-down-circle',
      color: '#FF3D71',
    },
    {
      direction: 'Left',
      percentage: result.directionPreferences.left,
      icon: 'arrow-back-circle',
      color: '#FFD700',
    },
    {
      direction: 'Right',
      percentage: result.directionPreferences.right,
      icon: 'arrow-forward-circle',
      color: '#7B68EE',
    },
  ];

  return (
    <GalaxyBackground intensity="vibrant" animated>
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100)}>
            <CosmicCard
              elevation={2}
              glowBorder
              accentColor="stellar-blue"
              style={styles.headerCard}
            >
              <View style={styles.headerContent}>
                <Ionicons name="git-network" size={48} color="#00E5FF" />
                <Text style={styles.title}>Cognitive Synchrony</Text>
                <Text style={styles.subtitle}>Maze Navigation Results</Text>
              </View>
            </CosmicCard>
          </Animated.View>

          {/* Overall Score */}
          <Animated.View entering={FadeInDown.delay(200)}>
            <CosmicCard
              elevation={3}
              glowBorder
              accentColor="nebula-purple"
              style={styles.scoreCard}
            >
              <Text style={styles.scoreLabel}>Overall Synchronicity</Text>
              <Text style={styles.scoreValue}>{result.synchronicity.overallScore}%</Text>
              <View style={styles.scoreBar}>
                <View
                  style={[
                    styles.scoreBarFill,
                    { width: `${result.synchronicity.overallScore}%` },
                  ]}
                />
              </View>
            </CosmicCard>
          </Animated.View>

          {/* Direction Preferences */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <CosmicCard
              elevation={2}
              glowBorder
              accentColor="cosmic-pink"
              style={styles.sectionCard}
            >
              <Text style={styles.sectionTitle}>Direction Preferences</Text>
              <Text style={styles.sectionSubtitle}>
                How you navigate challenges
              </Text>

              <View style={styles.directionsGrid}>
                {directionStats.map((stat, index) => (
                  <Animated.View
                    key={stat.direction}
                    entering={FadeInUp.delay(400 + index * 100)}
                    style={styles.directionItem}
                  >
                    <Ionicons name={stat.icon} size={32} color={stat.color} />
                    <Text style={styles.directionLabel}>{stat.direction}</Text>
                    <Text style={[styles.directionValue, { color: stat.color }]}>
                      {stat.percentage}%
                    </Text>
                    <View style={styles.directionBar}>
                      <View
                        style={[
                          styles.directionBarFill,
                          {
                            width: `${stat.percentage}%`,
                            backgroundColor: stat.color,
                          },
                        ]}
                      />
                    </View>
                  </Animated.View>
                ))}
              </View>
            </CosmicCard>
          </Animated.View>

          {/* Error Patterns */}
          <Animated.View entering={FadeInDown.delay(700)}>
            <CosmicCard
              elevation={2}
              glowBorder
              accentColor="aurora-green"
              style={styles.sectionCard}
            >
              <Text style={styles.sectionTitle}>Error Patterns</Text>
              <View style={styles.errorStats}>
                <View style={styles.errorStat}>
                  <Text style={styles.errorLabel}>Error Rate</Text>
                  <Text style={styles.errorValue}>{result.errorRate}/min</Text>
                </View>
                <View style={styles.errorStat}>
                  <Text style={styles.errorLabel}>Direction Sync</Text>
                  <Text style={styles.errorValue}>
                    {result.synchronicity.directionAlignment}%
                  </Text>
                </View>
                <View style={styles.errorStat}>
                  <Text style={styles.errorLabel}>Error Style Match</Text>
                  <Text style={styles.errorValue}>
                    {result.synchronicity.errorStyleMatch}%
                  </Text>
                </View>
              </View>
            </CosmicCard>
          </Animated.View>

          {/* Insights */}
          <Animated.View entering={FadeInDown.delay(800)}>
            <CosmicCard
              elevation={2}
              glowBorder
              accentColor="solar-gold"
              style={styles.sectionCard}
            >
              <Text style={styles.sectionTitle}>Insights</Text>
              {result.insights.map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <Ionicons name="bulb" size={20} color="#FFD700" />
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              ))}
            </CosmicCard>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View entering={FadeInDown.delay(900)} style={styles.actions}>
            <NeonButton
              onPress={handleShare}
              variant="outline"
              accentColor="stellar-blue"
              fullWidth
              icon={<Ionicons name="share-social" size={20} color="#00E5FF" />}
              iconPosition="left"
              style={styles.actionButton}
            >
              Share Results
            </NeonButton>
            <NeonButton
              onPress={handlePlayAgain}
              accentColor="nebula-purple"
              fullWidth
              style={styles.actionButton}
            >
              Play Again
            </NeonButton>
            <NeonButton
              onPress={handleViewAll}
              variant="secondary"
              accentColor="cosmic-pink"
              fullWidth
              style={styles.actionButton}
            >
              View All Results
            </NeonButton>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </GalaxyBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 24,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 4,
  },
  scoreCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 18,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#7B68EE',
    marginBottom: 16,
  },
  scoreBar: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: '#7B68EE',
    borderRadius: 6,
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 16,
  },
  directionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  directionItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
  },
  directionLabel: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 8,
  },
  directionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  directionBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  directionBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  errorStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  errorStat: {
    alignItems: 'center',
  },
  errorLabel: {
    fontSize: 12,
    color: '#AAAAAA',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00FFB3',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 15,
    color: '#EEEEEE',
    marginLeft: 12,
    lineHeight: 22,
  },
  actions: {
    marginTop: 8,
  },
  actionButton: {
    marginBottom: 12,
  },
});
