/**
 * Emotion Results Screen
 * Displays emotional resonance mapping insights and vocabulary overlap
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
  FadeInLeft,
  FadeInRight,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '@/theme/haptics';
import { GalaxyBackground, CosmicCard, NeonButton } from '@/components/common';
import { useGamesStore } from '@/state/gamesStore';
import { emotionAnalysisService } from '@/services/games/emotionAnalysis';
import type { EmotionResult, EmotionData, EmotionWord } from '@/state/gamesStore';

type RootStackParamList = {
  EmotionResults: { sessionId: string };
  PsychicGamesHub: undefined;
  ResultsDashboard: { gameType?: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'EmotionResults'>;

const EMOTION_COLORS: Record<EmotionWord, string> = {
  joy: '#FFD700',
  sadness: '#4682B4',
  anger: '#FF3D71',
  fear: '#8B008B',
  surprise: '#FF69B4',
  disgust: '#228B22',
  trust: '#00E5FF',
  anticipation: '#FFA500',
};

const EMOTION_ICONS: Record<EmotionWord, keyof typeof Ionicons.glyphMap> = {
  joy: 'happy',
  sadness: 'sad',
  anger: 'flame',
  fear: 'alert-circle',
  surprise: 'sparkles',
  disgust: 'close-circle',
  trust: 'heart',
  anticipation: 'rocket',
};

export const EmotionResults: React.FC<Props> = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const [result, setResult] = useState<EmotionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const getSessionById = useGamesStore((state) => state.getSessionById);

  useEffect(() => {
    loadResults();
  }, [sessionId]);

  const loadResults = async () => {
    try {
      const session = getSessionById(sessionId);
      if (!session || session.gameType !== 'emotion') {
        Alert.alert('Error', 'Session not found');
        navigation.goBack();
        return;
      }

      // If result already exists in session, use it
      if (session.result && session.result.gameType === 'emotion') {
        setResult(session.result as EmotionResult);
      } else {
        // Generate result (for single player or initial view)
        const emotionData = session.rawData as EmotionData;

        const generatedResult: EmotionResult = {
          gameType: 'emotion',
          completedAt: session.completedAt || new Date().toISOString(),
          vocabularyOverlap: 0,
          sharedAssociations: emotionData.associations.map((assoc) => ({
            emotion: assoc.emotion,
            images: assoc.selectedImages,
            confidence: 100,
          })),
          synchronicity: {
            overallScore: 0,
          },
          insights: [
            `You selected ${emotionData.associations.length} emotional associations.`,
            'Complete this game with your twin to see how your emotional vocabularies align!',
          ],
          shareable: true,
        };

        setResult(generatedResult);
      }
    } catch (error) {
      console.error('Failed to load emotion results:', error);
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
        message: `Twinship Emotional Resonance Results\n\nVocabulary Overlap: ${result.vocabularyOverlap}%\nEmotional Synchronicity: ${result.synchronicity.overallScore}%`,
        title: 'My Emotional Resonance Results',
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
    navigation.navigate('ResultsDashboard', { gameType: 'emotion' });
  };

  if (loading) {
    return (
      <GalaxyBackground intensity="vibrant" animated>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Analyzing emotional patterns...</Text>
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
              accentColor="cosmic-pink"
              style={styles.headerCard}
            >
              <View style={styles.headerContent}>
                <Ionicons name="heart-circle" size={48} color="#FF69B4" />
                <Text style={styles.title}>Emotional Resonance</Text>
                <Text style={styles.subtitle}>Vocabulary Overlap Analysis</Text>
              </View>
            </CosmicCard>
          </Animated.View>

          {/* Vocabulary Overlap */}
          <Animated.View entering={FadeInDown.delay(200)}>
            <CosmicCard
              elevation={3}
              glowBorder
              accentColor="nebula-purple"
              style={styles.scoreCard}
            >
              <Text style={styles.scoreLabel}>Vocabulary Overlap</Text>
              <Text style={styles.scoreValue}>{result.vocabularyOverlap}%</Text>
              <Text style={styles.scoreDescription}>
                Jaccard Similarity Score
              </Text>
              <View style={styles.overlapBar}>
                <View
                  style={[
                    styles.overlapBarFill,
                    { width: `${result.vocabularyOverlap}%` },
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
              <Text style={styles.sectionTitle}>Emotional Synchronicity</Text>
              <View style={styles.syncRow}>
                <View style={styles.syncItem}>
                  <Text style={styles.syncLabel}>Overall Score</Text>
                  <Text style={styles.syncValue}>
                    {result.synchronicity.overallScore}%
                  </Text>
                </View>
                <View style={styles.syncItem}>
                  <Text style={styles.syncLabel}>Shared Patterns</Text>
                  <Text style={styles.syncValue}>
                    {result.sharedAssociations.length}
                  </Text>
                </View>
              </View>
            </CosmicCard>
          </Animated.View>

          {/* Shared Emotional Themes */}
          <Animated.View entering={FadeInDown.delay(400)}>
            <CosmicCard
              elevation={2}
              glowBorder
              accentColor="aurora-green"
              style={styles.sectionCard}
            >
              <Text style={styles.sectionTitle}>Shared Emotional Themes</Text>
              <Text style={styles.sectionSubtitle}>
                Emotions with matching associations
              </Text>

              <View style={styles.emotionsGrid}>
                {result.sharedAssociations.slice(0, 6).map((assoc, index) => (
                  <Animated.View
                    key={assoc.emotion}
                    entering={FadeInLeft.delay(500 + index * 100)}
                    style={styles.emotionCard}
                  >
                    <Ionicons
                      name={EMOTION_ICONS[assoc.emotion]}
                      size={32}
                      color={EMOTION_COLORS[assoc.emotion]}
                    />
                    <Text style={styles.emotionName}>
                      {assoc.emotion.charAt(0).toUpperCase() + assoc.emotion.slice(1)}
                    </Text>
                    <Text
                      style={[
                        styles.emotionConfidence,
                        { color: EMOTION_COLORS[assoc.emotion] },
                      ]}
                    >
                      {assoc.confidence}%
                    </Text>
                    <View style={styles.confidenceBar}>
                      <View
                        style={[
                          styles.confidenceBarFill,
                          {
                            width: `${assoc.confidence}%`,
                            backgroundColor: EMOTION_COLORS[assoc.emotion],
                          },
                        ]}
                      />
                    </View>
                  </Animated.View>
                ))}
              </View>
            </CosmicCard>
          </Animated.View>

          {/* Word Cloud Visual */}
          <Animated.View entering={FadeInDown.delay(700)}>
            <CosmicCard
              elevation={2}
              glowBorder
              accentColor="solar-gold"
              style={styles.sectionCard}
            >
              <Text style={styles.sectionTitle}>Emotional Vocabulary</Text>
              <View style={styles.wordCloud}>
                {result.sharedAssociations.map((assoc, index) => (
                  <Animated.View
                    key={assoc.emotion}
                    entering={FadeInRight.delay(800 + index * 50)}
                    style={[
                      styles.wordTag,
                      {
                        backgroundColor: `${EMOTION_COLORS[assoc.emotion]}33`,
                        borderColor: EMOTION_COLORS[assoc.emotion],
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.wordTagText,
                        { color: EMOTION_COLORS[assoc.emotion] },
                      ]}
                    >
                      {assoc.emotion}
                    </Text>
                  </Animated.View>
                ))}
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
              accentColor="cosmic-pink"
              fullWidth
              icon={<Ionicons name="share-social" size={20} color="#FF69B4" />}
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
    color: '#FF69B4',
    marginBottom: 4,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 16,
  },
  overlapBar: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  overlapBarFill: {
    height: '100%',
    backgroundColor: '#FF69B4',
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
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  syncItem: {
    alignItems: 'center',
  },
  syncLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 8,
  },
  syncValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00E5FF',
  },
  emotionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emotionCard: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  emotionName: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 8,
    fontWeight: '600',
  },
  emotionConfidence: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  confidenceBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  wordCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  wordTagText: {
    fontSize: 14,
    fontWeight: '600',
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
