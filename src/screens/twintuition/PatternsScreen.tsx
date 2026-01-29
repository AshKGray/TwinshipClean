/**
 * Patterns Screen
 *
 * Analytics dashboard showing alert patterns and insights.
 * Story: 3-6 Twintuition Pattern Analysis Dashboard
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CosmicCard from '../../components/common/CosmicCard';
import NeonButton from '../../components/common/NeonButton';
import { alertService } from '../../services/alertService';
import { useTwinStore } from '../../state/twinStore';
import { useAlertStore } from '../../state/alertStore';
import type { AlertStats, AlertPatternInsight } from '../../types/alert';
import { getAlertTypeMetadata } from '../../types/alert';

const { width } = Dimensions.get('window');

interface PatternsScreenProps {
  navigation: any;
}

const PatternsScreen: React.FC<PatternsScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [insights, setInsights] = useState<AlertPatternInsight[]>([]);

  const userProfile = useTwinStore(state => state.userProfile);
  const statsCache = useAlertStore(state => state.statsCache);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    if (!userProfile) return;

    setLoading(true);
    try {
      // Try to use cached stats first
      if (statsCache) {
        setStats(statsCache);
        const generatedInsights = await alertService.generatePatternInsights(statsCache);
        setInsights(generatedInsights);
      }

      // Load fresh stats
      const freshStats = await alertService.getAlertStats(userProfile.id, 30);
      setStats(freshStats);

      const generatedInsights = await alertService.generatePatternInsights(freshStats);
      setInsights(generatedInsights);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatCard = (title: string, value: string | number, subtitle?: string) => (
    <CosmicCard
      elevation={2}
      glowBorder
      accentColor="stellar-blue"
      padding={16}
      style={styles.statCard}
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </CosmicCard>
  );

  const renderAlertTypeChart = () => {
    if (!stats || !stats.alertsByType) return null;

    const types = Object.entries(stats.alertsByType).sort(([, a], [, b]) => b - a);
    const maxCount = types[0]?.[1] || 1;

    return (
      <CosmicCard
        elevation={2}
        glowBorder
        accentColor="stellar-blue"
        padding={20}
        style={styles.chartCard}
      >
        <Text style={styles.chartTitle}>Alert Types</Text>
        <View style={styles.chart}>
          {types.map(([type, count]) => {
            const metadata = getAlertTypeMetadata(type as any);
            const percentage = (count / maxCount) * 100;

            return (
              <View key={type} style={styles.chartRow}>
                <View style={styles.chartLabel}>
                  <Text style={styles.chartIcon}>{metadata.icon}</Text>
                  <Text style={styles.chartLabelText}>{metadata.label}</Text>
                </View>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      { width: `${percentage}%` },
                    ]}
                  />
                  <Text style={styles.barCount}>{count}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </CosmicCard>
    );
  };

  const renderHourChart = () => {
    if (!stats || !stats.alertsByHour) return null;

    const hours = Object.entries(stats.alertsByHour).sort(([a], [b]) => parseInt(a) - parseInt(b));
    const maxCount = Math.max(...hours.map(([, count]) => count), 1);

    return (
      <CosmicCard
        elevation={2}
        glowBorder
        accentColor="aurora-teal"
        padding={20}
        style={styles.chartCard}
      >
        <Text style={styles.chartTitle}>Alert Activity by Hour</Text>
        <View style={styles.hourChart}>
          {hours.map(([hour, count]) => {
            const height = (count / maxCount) * 100;

            return (
              <View key={hour} style={styles.hourBar}>
                <View style={styles.hourBarContainer}>
                  <View
                    style={[
                      styles.hourBarFill,
                      { height: `${height}%` },
                    ]}
                  />
                </View>
                <Text style={styles.hourLabel}>{hour}</Text>
              </View>
            );
          })}
        </View>
      </CosmicCard>
    );
  };

  const renderInsightCard = (insight: AlertPatternInsight) => (
    <CosmicCard
      key={insight.title}
      elevation={2}
      glowBorder
      accentColor="celestial-indigo"
      padding={16}
      style={styles.insightCard}
    >
      <View style={styles.insightHeader}>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>
            {Math.round(insight.confidence * 100)}%
          </Text>
        </View>
      </View>
      <Text style={styles.insightDescription}>{insight.description}</Text>
    </CosmicCard>
  );

  if (loading) {
    return (
      <ImageBackground
        source={require('../../../assets/galaxybackground.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00D4FF" />
            <Text style={styles.loadingText}>Analyzing patterns...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (!stats) {
    return (
      <ImageBackground
        source={require('../../../assets/galaxybackground.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No Data Yet</Text>
            <Text style={styles.emptyText}>
              Send some alerts to see your patterns!
            </Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../../assets/galaxybackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Alert Patterns</Text>
            <Text style={styles.subtitle}>Last 30 days</Text>
          </View>

          {/* Overview Stats */}
          <View style={styles.statsGrid}>
            {renderStatCard('Total Sent', stats.totalSent)}
            {renderStatCard('Total Received', stats.totalReceived)}
            {renderStatCard('Sync Moments', stats.totalSyncMoments, '✨ Cosmic')}
            {renderStatCard(
              'Response Time',
              `${stats.averageResponseTimeMinutes}m`,
              'Average'
            )}
          </View>

          {/* Insights */}
          {insights.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Insights</Text>
              {insights.map(renderInsightCard)}
            </View>
          )}

          {/* Alert Type Chart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distribution</Text>
            {renderAlertTypeChart()}
          </View>

          {/* Hour Chart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Patterns</Text>
            {renderHourChart()}
          </View>

          {/* Refresh Button */}
          <View style={styles.actions}>
            <NeonButton
              variant="outline"
              accentColor="stellar-blue"
              onPress={loadAnalytics}
              fullWidth
              testID="refresh-analytics-button"
            >
              Refresh Analytics
            </NeonButton>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 52) / 2,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#00D4FF',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E5E7EB',
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  chartCard: {
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 16,
  },
  chart: {
    gap: 12,
  },
  chartRow: {
    gap: 8,
  },
  chartLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  chartIcon: {
    fontSize: 20,
  },
  chartLabelText: {
    fontSize: 14,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    height: 24,
    backgroundColor: 'rgba(0, 212, 255, 0.6)',
    borderRadius: 4,
    minWidth: 2,
  },
  barCount: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
    minWidth: 30,
  },
  hourChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 150,
    gap: 2,
  },
  hourBar: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  hourBarContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  hourBarFill: {
    width: '100%',
    backgroundColor: 'rgba(0, 212, 255, 0.6)',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 2,
  },
  hourLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  insightCard: {
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00D4FF',
  },
  insightDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  actions: {
    marginTop: 8,
    marginBottom: 40,
  },
});

export default PatternsScreen;
