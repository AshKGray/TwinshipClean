/**
 * Duo Results Screen
 * Displays iconic duo match and personality archetype analysis
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Share,
  Alert,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  BounceIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '@/theme/haptics';
import { GalaxyBackground, CosmicCard, NeonButton } from '@/components/common';
import { useGamesStore } from '@/state/gamesStore';
import { duoMatchingService } from '@/services/games/duoMatching';
import type { DuoResult, DuoData } from '@/state/gamesStore';

type RootStackParamList = {
  DuoResults: { sessionId: string };
  PsychicGamesHub: undefined;
  ResultsDashboard: { gameType?: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'DuoResults'>;

export const DuoResults: React.FC<Props> = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const [result, setResult] = useState<DuoResult | null>(null);
  const [loading, setLoading] = useState(true);
  const getSessionById = useGamesStore((state) => state.getSessionById);

  useEffect(() => {
    loadResults();
  }, [sessionId]);

  const loadResults = async () => {
    try {
      const session = getSessionById(sessionId);
      if (!session || session.gameType !== 'duo') {
        Alert.alert('Error', 'Session not found');
        navigation.goBack();
        return;
      }

      // If result already exists in session, use it
      if (session.result && session.result.gameType === 'duo') {
        setResult(session.result as DuoResult);
      } else {
        // Generate result
        const duoData = session.rawData as DuoData;
        const generatedResult = duoMatchingService.generateDuoResult(duoData);
        setResult(generatedResult);
      }
    } catch (error) {
      console.error('Failed to load duo results:', error);
      Alert.alert('Error', 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!result) return;

    triggerHaptic('success');
    const shareCard = duoMatchingService.generateShareCard(result);
    try {
      await Share.share({
        message: `We're like ${shareCard.title}!\n\n"${shareCard.subtitle}"\n\nOur traits: ${shareCard.traits.join(', ')}\n\nTwinship App`,
        title: 'My Iconic Duo Match',
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
    navigation.navigate('ResultsDashboard', { gameType: 'duo' });
  };

  if (loading) {
    return (
      <GalaxyBackground intensity="vibrant" animated>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Finding your iconic duo match...</Text>
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
          {/* Hero Card - Matched Duo */}
          <Animated.View entering={ZoomIn.delay(100)}>
            <CosmicCard
              elevation={3}
              glowBorder
              accentColor="stellar-blue"
              style={styles.heroCard}
            >
              <Animated.View entering={BounceIn.delay(300)} style={styles.heroContent}>
                <Ionicons name="people" size={64} color="#00E5FF" />
                <Text style={styles.heroTitle}>You're Like...</Text>
                <Text style={styles.duoName}>{result.matchedDuo.name}</Text>
                <View style={styles.archetypeBadge}>
                  <Text style={styles.archetypeText}>
                    {result.matchedDuo.archetype}
                  </Text>
                </View>
              </Animated.View>
            </CosmicCard>
          </Animated.View>

          {/* Duo Description */}
          <Animated.View entering={FadeInDown.delay(400)}>
            <CosmicCard
              elevation={2}
              glowBorder
              accentColor="nebula-purple"
              style={styles.sectionCard}
            >
              <Ionicons name="book" size={32} color="#7B68EE" />
              <Text style={styles.sectionTitle}>About This Duo</Text>
              <Text style={styles.duoDescription}>
                {result.matchedDuo.description}
              </Text>
            </CosmicCard>
          </Animated.View>

          {/* Key Traits */}
          <Animated.View entering={FadeInDown.delay(500)}>
            <CosmicCard
              elevation={2}
              glowBorder
              accentColor="cosmic-pink"
              style={styles.sectionCard}
            >
              <Text style={styles.sectionTitle}>Defining Traits</Text>
              <Text style={styles.sectionSubtitle}>
                What makes you unique
              </Text>
              <View style={styles.traitsGrid}>
                {result.keyTraits.map((trait, index) => (
                  <Animated.View
                    key={trait}
                    entering={FadeInUp.delay(600 + index * 100)}
                    style={styles.traitBadge}
                  >
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.traitText}>
                      {trait.charAt(0).toUpperCase() + trait.slice(1)}
                    </Text>
                  </Animated.View>
                ))}
              </View>
            </CosmicCard>
          </Animated.View>

          {/* Archetype Traits */}
          <Animated.View entering={FadeInDown.delay(700)}>
            <CosmicCard
              elevation={2}
              glowBorder
              accentColor="aurora-green"
              style={styles.sectionCard}
            >
              <Text style={styles.sectionTitle}>Archetype Traits</Text>
              <Text style={styles.sectionSubtitle}>
                Characteristics of {result.matchedDuo.archetype}
              </Text>
              <View style={styles.archetypeTraits}>
                {result.matchedDuo.traits.slice(0, 5).map((trait, index) => (
                  <Animated.View
                    key={trait}
                    entering={FadeInDown.delay(800 + index * 100)}
                    style={styles.archetypeTraitItem}
                  >
                    <View style={styles.archetypeTraitBullet} />
                    <Text style={styles.archetypeTraitText}>
                      {trait.charAt(0).toUpperCase() + trait.slice(1)}
                    </Text>
                  </Animated.View>
                ))}
              </View>
            </CosmicCard>
          </Animated.View>

          {/* Self-Awareness Score */}
          <Animated.View entering={FadeInDown.delay(900)}>
            <CosmicCard
              elevation={2}
              glowBorder
              accentColor="solar-gold"
              style={styles.sectionCard}
            >
              <Text style={styles.sectionTitle}>Self-Awareness</Text>
              <Text style={styles.sectionSubtitle}>
                How well you know your twin
              </Text>
              <View style={styles.awarenessContainer}>
                <Text style={styles.awarenessScore}>{result.selfAwareness}%</Text>
                <View style={styles.awarenessBar}>
                  <View
                    style={[
                      styles.awarenessBarFill,
                      { width: `${result.selfAwareness}%` },
                    ]}
                  />
                </View>
                <Text style={styles.awarenessLabel}>
                  {result.selfAwareness >= 70
                    ? 'Excellent Understanding'
                    : result.selfAwareness >= 50
                    ? 'Good Insight'
                    : 'Room to Discover'}
                </Text>
              </View>
            </CosmicCard>
          </Animated.View>

          {/* Perception Gap */}
          <Animated.View entering={FadeInDown.delay(1000)}>
            <CosmicCard
              elevation={2}
              glowBorder
              accentColor="stellar-blue"
              style={styles.sectionCard}
            >
              <Text style={styles.sectionTitle}>Perception Analysis</Text>
              <View style={styles.perceptionGrid}>
                <View style={styles.perceptionItem}>
                  <Ionicons name="eye" size={32} color="#00E5FF" />
                  <Text style={styles.perceptionLabel}>Perception Gap</Text>
                  <Text style={styles.perceptionValue}>
                    {result.perceptionGap}%
                  </Text>
                </View>
                <View style={styles.perceptionDivider} />
                <View style={styles.perceptionItem}>
                  <Ionicons name="checkmark-circle" size={32} color="#00FFB3" />
                  <Text style={styles.perceptionLabel}>Match Score</Text>
                  <Text style={styles.perceptionValue}>
                    {result.synchronicity.overallScore}%
                  </Text>
                </View>
              </View>
            </CosmicCard>
          </Animated.View>

          {/* Insights */}
          <Animated.View entering={FadeInDown.delay(1100)}>
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
          <Animated.View entering={FadeInDown.delay(1200)} style={styles.actions}>
            <NeonButton
              onPress={handleShare}
              variant="primary"
              accentColor="stellar-blue"
              fullWidth
              icon={<Ionicons name="share-social" size={20} color="#FFFFFF" />}
              iconPosition="left"
              style={styles.actionButton}
            >
              Share Your Duo
            </NeonButton>
            <NeonButton
              onPress={handlePlayAgain}
              variant="outline"
              accentColor="nebula-purple"
              fullWidth
              style={styles.actionButton}
            >
              Take Quiz Again
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
  heroCard: {
    marginBottom: 16,
    paddingVertical: 24,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 18,
    color: '#CCCCCC',
    marginTop: 16,
  },
  duoName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  archetypeBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00E5FF',
    marginTop: 16,
  },
  archetypeText: {
    fontSize: 16,
    color: '#00E5FF',
    fontWeight: '600',
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
  duoDescription: {
    fontSize: 16,
    color: '#EEEEEE',
    lineHeight: 24,
    marginTop: 12,
  },
  traitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  traitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  traitText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
    marginLeft: 6,
  },
  archetypeTraits: {
    marginTop: 8,
  },
  archetypeTraitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  archetypeTraitBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FFB3',
    marginRight: 12,
  },
  archetypeTraitText: {
    fontSize: 16,
    color: '#EEEEEE',
  },
  awarenessContainer: {
    alignItems: 'center',
  },
  awarenessScore: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
  },
  awarenessBar: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  awarenessBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 6,
  },
  awarenessLabel: {
    fontSize: 18,
    color: '#CCCCCC',
    fontWeight: '600',
  },
  perceptionGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  perceptionItem: {
    alignItems: 'center',
    flex: 1,
  },
  perceptionDivider: {
    width: 2,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  perceptionLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    marginTop: 8,
    textAlign: 'center',
  },
  perceptionValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
