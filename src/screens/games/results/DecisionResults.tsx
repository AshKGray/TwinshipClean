/**
 * Decision Results Screen
 * Displays temporal decision synchrony and value alignment analysis
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, {
  FadeInDown,
  FadeInUp,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '@/theme/haptics';
import { GalaxyBackground, CosmicCard, NeonButton } from '@/components/common';
import { useGamesStore } from '@/state/gamesStore';
import { decisionAnalysisService } from '@/services/games/decisionAnalysis';
import type { DecisionResult, DecisionData } from '@/state/gamesStore';

type RootStackParamList = {
  DecisionResults: { sessionId: string };
  PsychicGamesHub: undefined;
  ResultsDashboard: { gameType?: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'DecisionResults'>;

interface CategoryAlignment {
  category: string;
  percentage: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const DecisionResults: React.FC<Props> = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const getSessionById = useGamesStore((state) => state.getSessionById);

  useEffect(() => {
    loadResults();
  }, [sessionId]);

  const loadResults = async () => {
    try {
      const session = getSessionById(sessionId);
      if (!session || session.gameType !== 'decision') {
        Alert.alert('Error', 'Session not found');
        navigation.goBack();
        return;
      }

      // If result already exists in session, use it
      if (session.result && session.result.gameType === 'decision') {
        setResult(session.result as DecisionResult);
      } else {
        // Generate result (for single player or initial view)
        const decisionData = session.rawData as DecisionData;
        const stressPattern = decisionAnalysisService.analyzeStressResponse(decisionData);

        const generatedResult: DecisionResult = {
          gameType: 'decision',
          completedAt: session.completedAt || new Date().toISOString(),
          valueAlignment: 0,
          categoryBreakdown: {
            risk: 0,
            ethics: 0,
            practical: 0,
            emotional: 0,
          },
          stressResponsePattern: stressPattern,
          synchronicity: {
            overallScore: 0,
          },
          insights: [
            `You completed ${decisionData.scenarios.length} decision scenarios.`,
            `Average response time: ${Math.round(decisionData.averageResponseTime / 1000)}s`,
            `Decision changes: ${decisionData.changeCount}`,
            'Complete this game with your twin to see how your values align!',
          ],
          shareable: true,
        };

        setResult(generatedResult);
      }
    } catch (error) {
      console.error('Failed to load decision results:', error);
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
        message: `Twinship Decision Synchrony Results\n\nValue Alignment: ${result.valueAlignment}%\nDecision Synchronicity: ${result.synchronicity.overallScore}%`,
        title: 'My Decision Results',
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
    navigation.navigate('ResultsDashboard', { gameType: 'decision' });
  };

  if (loading) {
    return (
      <GalaxyBackground intensity="vibrant" animated>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Analyzing decision patterns...</Text>
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

  const categoryAlignments: CategoryAlignment[] = [
    {
      category: 'Risk',
      percentage: result.categoryBreakdown.risk,
      color: '#FF3D71',
      icon: 'alert-circle',
    },
    {
      category: 'Ethics',
      percentage: result.categoryBreakdown.ethics,
      color: '#00E5FF',
      icon: 'shield-checkmark',
    },
    {
      category: 'Practical',
      percentage: result.categoryBreakdown.practical,
      color: '#FFD700',
      icon: 'construct',
    },
    {
      category: 'Emotional',
      percentage: result.categoryBreakdown.emotional,
      color: '#FF69B4',
      icon: 'heart',
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
              accentColor="aurora-green"
              style={styles.headerCard}
            >
              <View style={styles.headerContent}>
                <Ionicons name="timer" size={48} color="#00FFB3" />
                <Text style={styles.title}>Temporal Decision Synchrony</Text>
                <Text style={styles.subtitle}>Value Alignment Analysis</Text>
              </View>
            </CosmicCard>
          </Animated.View>

          {/* Value Alignment */}
          <Animated.View entering={FadeInDown.delay(200)}>
            <CosmicCard
              elevation={3}
              glowBorder
              accentColor="nebula-purple"
              style={styles.scoreCard}
            >
              <Text style={styles.scoreLabel}>Value Alignment</Text>
              <Text style={styles.scoreValue}>{result.valueAlignment}%</Text>
              <Text style={styles.scoreDescription}>
                Shared decision-making framework
              </Text>
              <View style={styles.alignmentBar}>
                <View
                  style={[
                    styles.alignmentBarFill,
                    { width: `${result.valueAlignment}%` },
                  ]}
                />
              </View>
            </CosmicCard>
          </Animated.View>

          {/* Overall Synchronicity */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <CosmicCard
              elevation={2}
              glowBorder
              accentColor="stellar-blue"
              style={styles.sectionCard}
            >
              <Text style={styles.sectionTitle}>Decision Synchronicity</Text>
              <Text style={styles.syncScore}>{result.synchronicity.overallScore}%</Text>
              <View style={styles.syncBar}>
                <View
                  style={[
                    styles.syncBarFill,
                    { width: `${result.synchronicity.overallScore}%` },
                  ]}
                />
              </View>
            </CosmicCard>
          </Animated.View>

          {/* Category Breakdown */}
          <Animated.View entering={FadeInDown.delay(400)}>
            <CosmicCard
              elevation={2}
              glowBorder
              accentColor="cosmic-pink"
              style={styles.sectionCard}
            >
              <Text style={styles.sectionTitle}>Category Breakdown</Text>
              <Text style={styles.sectionSubtitle}>
                Alignment across decision types
              </Text>

              <View style={styles.categoriesGrid}>
                {categoryAlignments.map((cat, index) => (
                  <Animated.View
                    key={cat.category}
                    entering={FadeInUp.delay(500 + index * 100)}
                    style={styles.categoryCard}
                  >
                    <Ionicons name={cat.icon} size={32} color={cat.color} />
                    <Text style={styles.categoryName}>{cat.category}</Text>
                    <Text style={[styles.categoryValue, { color: cat.color }]}>
                      {cat.percentage}%
                    </Text>
                    <View style={styles.categoryBar}>
                      <View
                        style={[
                          styles.categoryBarFill,
                          {
                            width: `${cat.percentage}%`,
                            backgroundColor: cat.color,
                          },
                        ]}
                      />
                    </View>
                  </Animated.View>
                ))}
              </View>
            </CosmicCard>
          </Animated.View>

          {/* Stress Response Pattern */}
          <Animated.View entering={FadeInDown.delay(700)}>
            <CosmicCard
              elevation={2}
              glowBorder
              accentColor="solar-gold"
              style={styles.sectionCard}
            >
              <Text style={styles.sectionTitle}>Stress Response Pattern</Text>
              <Text style={styles.sectionSubtitle}>
                How you handle pressure
              </Text>

              <View style={styles.stressStats}>
                <View style={styles.stressStat}>
                  <Ionicons
                    name={
                      result.stressResponsePattern.becomesMorePragmatic
                        ? 'checkmark-circle'
                        : 'flash'
                    }
                    size={32}
                    color={
                      result.stressResponsePattern.becomesMorePragmatic
                        ? '#00FFB3'
                        : '#FF69B4'
                    }
                  />
                  <Text style={styles.stressLabel}>Under Pressure</Text>
                  <Text style={styles.stressValue}>
                    {result.stressResponsePattern.becomesMorePragmatic
                      ? 'More Deliberate'
                      : 'Maintains Speed'}
                  </Text>
                </View>

                <View style={styles.stressStat}>
                  <Ionicons name="speedometer" size={32} color="#FFD700" />
                  <Text style={styles.stressLabel}>Speed Change</Text>
                  <Text style={styles.stressValue}>
                    {result.stressResponsePattern.speedChange > 0 ? '+' : ''}
                    {result.stressResponsePattern.speedChange}%
                  </Text>
                </View>

                <View style={styles.stressStat}>
                  <Ionicons name="git-compare" size={32} color="#00E5FF" />
                  <Text style={styles.stressLabel}>Changes</Text>
                  <Text style={styles.stressValue}>
                    {result.stressResponsePattern.changeFrequency}%
                  </Text>
                </View>
              </View>
            </CosmicCard>
          </Animated.View>

          {/* Visual Comparison */}
          <Animated.View entering={FadeInDown.delay(800)}>
            <CosmicCard
              elevation={2}
              glowBorder
              accentColor="aurora-green"
              style={styles.sectionCard}
            >
              <Text style={styles.sectionTitle}>Agreement vs Disagreement</Text>
              <View style={styles.comparisonContainer}>
                <View style={styles.comparisonSide}>
                  <Ionicons name="checkmark-circle" size={40} color="#00FFB3" />
                  <Text style={styles.comparisonLabel}>Agreement</Text>
                  <Text style={[styles.comparisonValue, { color: '#00FFB3' }]}>
                    {result.valueAlignment}%
                  </Text>
                </View>
                <View style={styles.comparisonDivider} />
                <View style={styles.comparisonSide}>
                  <Ionicons name="close-circle" size={40} color="#FF3D71" />
                  <Text style={styles.comparisonLabel}>Different Views</Text>
                  <Text style={[styles.comparisonValue, { color: '#FF3D71' }]}>
                    {100 - result.valueAlignment}%
                  </Text>
                </View>
              </View>
            </CosmicCard>
          </Animated.View>

          {/* Insights */}
          <Animated.View entering={FadeInDown.delay(900)}>
            <CosmicCard
              elevation={2}
              glowBorder
              accentColor="cosmic-pink"
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
          <Animated.View entering={FadeInDown.delay(1000)} style={styles.actions}>
            <NeonButton
              onPress={handleShare}
              variant="outline"
              accentColor="aurora-green"
              fullWidth
              icon={<Ionicons name="share-social" size={20} color="#00FFB3" />}
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
              accentColor="stellar-blue"
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
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    textAlign: 'center',
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
    marginBottom: 4,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 16,
  },
  alignmentBar: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  alignmentBarFill: {
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
  syncScore: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#00E5FF',
    textAlign: 'center',
    marginBottom: 12,
  },
  syncBar: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  syncBarFill: {
    height: '100%',
    backgroundColor: '#00E5FF',
    borderRadius: 5,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  categoryName: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 8,
    fontWeight: '600',
  },
  categoryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  categoryBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  stressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stressStat: {
    alignItems: 'center',
    flex: 1,
  },
  stressLabel: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 8,
    textAlign: 'center',
  },
  stressValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'center',
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  comparisonSide: {
    alignItems: 'center',
    flex: 1,
  },
  comparisonDivider: {
    width: 2,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 8,
    textAlign: 'center',
  },
  comparisonValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
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
