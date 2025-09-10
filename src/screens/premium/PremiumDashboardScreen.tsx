import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Premium components
import { PremiumGatedContent } from '../../components/premium/PremiumGatedContent';
import { PremiumStatusIndicator } from '../../components/premium/PremiumStatusIndicator';
import { PremiumUpgradeButton } from '../../components/premium/PremiumBadge';

// Hooks and utilities
import { useAnalyticsPremium } from '../../hooks/usePremiumFeatures';
import { pdfExportService } from '../../utils/pdfExportService';

// Core imports
import { useTwinStore } from '../../state/twinStore';
import { useAssessmentStore } from '../../state/assessmentStore';
import { getNeonAccentColor, getNeonGradientColors } from '../../utils/neonColors';

const { width } = Dimensions.get('window');

// Analytics Card Component
const AnalyticsCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}> = ({ title, value, subtitle, icon, color, trend, trendValue }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return '#10b981';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <LinearGradient
      colors={[`${color}20`, `${color}10`, 'transparent']}
      className="rounded-2xl p-4 border"
      style={{ borderColor: `${color}40` }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Ionicons name={icon as any} size={24} color={color} />
        {trend && trendValue && (
          <View className="flex-row items-center">
            <Ionicons name={getTrendIcon() as any} size={16} color={getTrendColor()} />
            <Text className="text-xs font-bold ml-1" style={{ color: getTrendColor() }}>
              {trendValue}
            </Text>
          </View>
        )}
      </View>
      
      <Text className="text-white text-2xl font-bold mb-1">{value}</Text>
      <Text className="text-white text-sm font-medium mb-1">{title}</Text>
      {subtitle && (
        <Text className="text-gray-400 text-xs">{subtitle}</Text>
      )}
    </LinearGradient>
  );
};

// Progress Ring Component
const ProgressRing: React.FC<{
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  label: string;
  value: string;
}> = ({ progress, size, strokeWidth, color, label, value }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <View className="items-center">
      <View style={{ width: size, height: size }} className="relative">
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-white text-xl font-bold">{value}</Text>
          <Text className="text-gray-400 text-xs">{label}</Text>
        </View>
        
        {/* Background circle */}
        <View
          className="absolute rounded-full border"
          style={{
            width: size,
            height: size,
            borderWidth: strokeWidth,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        />
        
        {/* Progress circle */}
        <View
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            borderWidth: strokeWidth,
            borderColor: color,
            borderRadius: size / 2,
            transform: [{ rotate: '-90deg' }],
            borderTopColor: 'transparent',
            borderRightColor: offset > circumference * 0.75 ? 'transparent' : color,
            borderBottomColor: offset > circumference * 0.5 ? 'transparent' : color,
            borderLeftColor: offset > circumference * 0.25 ? 'transparent' : color,
          }}
        />
      </View>
    </View>
  );
};

export const PremiumDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { userProfile, twinProfile } = useTwinStore();
  const { getAllResults } = useAssessmentStore();
  
  const {
    canViewAdvancedAnalytics,
    canRetakeAssessments,
    requireAdvancedAnalytics,
    navigateToUpgrade
  } = useAnalyticsPremium();
  
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('month');
  
  const themeColor = userProfile?.accentColor || 'neon-purple';
  const neonColor = getNeonAccentColor(themeColor);
  const [gradientStart, gradientMid] = getNeonGradientColors(themeColor);
  
  // Mock analytics data (in production, this would come from your analytics service)
  const analyticsData = {
    syncScore: 87,
    communicationTrend: '+12%',
    conflictResolution: 85,
    growthScore: 92,
    assessmentsCompleted: 3,
    recommendationsFollowed: 8,
    streakDays: 21,
    twinCompatibility: 94
  };

  const handleRetakeAssessment = () => {
    if (!canRetakeAssessments) {
      navigateToUpgrade('unlimited_assessments', 'retake_button');
      return;
    }
    navigation.navigate('AssessmentIntro');
  };

  const handleExportReport = async () => {
    if (!canViewAdvancedAnalytics) {
      navigateToUpgrade('twin_analytics', 'export_report');
      return;
    }
    
    // Implementation would export comprehensive analytics report
    try {
      const results = getAllResults();
      if (results.length === 0) return;
      
      // Use latest results for export
      const latestResults = results[0];
      await pdfExportService.shareAssessmentPDF({
        personalityScores: latestResults.personalityScores.reduce((acc, score) => {
          acc[score.trait] = score.value;
          return acc;
        }, {} as Record<string, number>),
        twinDynamics: {
          syncScore: analyticsData.syncScore,
          communicationTrend: analyticsData.communicationTrend,
          conflictResolution: analyticsData.conflictResolution
        },
        recommendations: latestResults.recommendations.map(r => r.description),
        timestamp: latestResults.timestamp,
        userProfile: {
          name: userProfile?.name || 'User',
          twinType: userProfile?.twinType || 'unknown'
        },
        twinProfile: twinProfile ? { name: twinProfile.name } : undefined
      });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6">
          {/* Header */}
          <View className="flex-row items-center justify-between pt-4 pb-6">
            <Pressable onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <View className="flex-1 items-center">
              <Text className="text-white text-xl font-semibold">Twin Analytics</Text>
              <PremiumStatusIndicator variant="minimal" />
            </View>
            <Pressable onPress={handleExportReport}>
              <Ionicons name="share-outline" size={24} color="white" />
            </Pressable>
          </View>

          {/* Timeframe Selector */}
          <PremiumGatedContent
            featureId="twin_analytics"
            gateType="teaser"
            onUpgradeRequest={() => navigateToUpgrade('twin_analytics', 'dashboard_main')}
          >
            <View className="flex-row bg-white/10 rounded-2xl p-1 mb-6">
              {(['week', 'month', 'all'] as const).map((timeframe) => (
                <Pressable
                  key={timeframe}
                  onPress={() => setSelectedTimeframe(timeframe)}
                  className={`flex-1 py-2 rounded-xl ${
                    selectedTimeframe === timeframe ? '' : ''
                  }`}
                  style={{
                    backgroundColor: selectedTimeframe === timeframe ? neonColor : 'transparent'
                  }}
                >
                  <Text
                    className={`text-center font-semibold capitalize ${
                      selectedTimeframe === timeframe ? 'text-black' : 'text-white'
                    }`}
                  >
                    {timeframe === 'all' ? 'All Time' : `This ${timeframe}`}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Key Metrics Grid */}
            <View className="grid grid-cols-2 gap-4 mb-6">
              <View className="space-y-4">
                <AnalyticsCard
                  title="Twin Sync Score"
                  value={`${analyticsData.syncScore}%`}
                  subtitle="Overall connection strength"
                  icon="heart"
                  color={neonColor}
                  trend="up"
                  trendValue="+5%"
                />
                
                <AnalyticsCard
                  title="Communication"
                  value="Strong"
                  subtitle={`${analyticsData.communicationTrend} this month`}
                  icon="chatbubbles"
                  color="#10b981"
                  trend="up"
                  trendValue={analyticsData.communicationTrend}
                />
              </View>
              
              <View className="space-y-4">
                <AnalyticsCard
                  title="Growth Score"
                  value={`${analyticsData.growthScore}%`}
                  subtitle="Personal development"
                  icon="trending-up"
                  color="#3b82f6"
                  trend="up"
                  trendValue="+8%"
                />
                
                <AnalyticsCard
                  title="Conflict Resolution"
                  value={`${analyticsData.conflictResolution}%`}
                  subtitle="Healthy boundary setting"
                  icon="shield-checkmark"
                  color="#f59e0b"
                  trend="stable"
                  trendValue="0%"
                />
              </View>
            </View>

            {/* Progress Rings */}
            <View className="bg-white/5 rounded-2xl p-6 mb-6">
              <Text className="text-white text-lg font-semibold mb-6">Your Twin Journey</Text>
              
              <View className="flex-row justify-around">
                <ProgressRing
                  progress={analyticsData.twinCompatibility}
                  size={100}
                  strokeWidth={8}
                  color={neonColor}
                  label="Compatibility"
                  value={`${analyticsData.twinCompatibility}%`}
                />
                
                <ProgressRing
                  progress={(analyticsData.streakDays / 30) * 100}
                  size={100}
                  strokeWidth={8}
                  color="#10b981"
                  label="Consistency"
                  value={`${analyticsData.streakDays}d`}
                />
                
                <ProgressRing
                  progress={(analyticsData.recommendationsFollowed / 10) * 100}
                  size={100}
                  strokeWidth={8}
                  color="#3b82f6"
                  label="Growth"
                  value={`${analyticsData.recommendationsFollowed}/10`}
                />
              </View>
            </View>

            {/* Recent Activity */}
            <View className="bg-white/5 rounded-2xl p-6 mb-6">
              <Text className="text-white text-lg font-semibold mb-4">Recent Activity</Text>
              
              <View className="space-y-3">
                <View className="flex-row items-center">
                  <View 
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: `${neonColor}20` }}
                  >
                    <Ionicons name="analytics" size={20} color={neonColor} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-medium">Assessment completed</Text>
                    <Text className="text-gray-400 text-sm">2 days ago</Text>
                  </View>
                  <Text className="text-green-400 text-sm font-bold">+3 points</Text>
                </View>
                
                <View className="flex-row items-center">
                  <View 
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: '#10b98120' }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-medium">Weekly exercise completed</Text>
                    <Text className="text-gray-400 text-sm">5 days ago</Text>
                  </View>
                  <Text className="text-blue-400 text-sm font-bold">Streak +1</Text>
                </View>
                
                <View className="flex-row items-center">
                  <View 
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: '#3b82f620' }}
                  >
                    <Ionicons name="people" size={20} color="#3b82f6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-medium">Twin comparison updated</Text>
                    <Text className="text-gray-400 text-sm">1 week ago</Text>
                  </View>
                  <Text className="text-purple-400 text-sm font-bold">New insights</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="space-y-3 mb-8">
              <Pressable
                onPress={handleRetakeAssessment}
                style={{ backgroundColor: neonColor }}
                className="rounded-xl p-4"
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="refresh" size={20} color="black" />
                  <Text className="text-black font-bold ml-2 text-lg">
                    {canRetakeAssessments ? 'Retake Assessment' : 'Unlock Unlimited Retakes'}
                  </Text>
                </View>
              </Pressable>
              
              <View className="flex-row space-x-3">
                <Pressable 
                  onPress={() => navigation.navigate('AssessmentRecommendations')}
                  className="flex-1 bg-white/10 rounded-xl p-3"
                >
                  <Text className="text-white text-center font-medium">View Coaching</Text>
                </Pressable>
                
                <Pressable 
                  onPress={handleExportReport}
                  className="flex-1 bg-white/10 rounded-xl p-3"
                >
                  <Text className="text-white text-center font-medium">Export Report</Text>
                </Pressable>
              </View>
            </View>

            {/* Insights Section */}
            <View className="bg-white/5 rounded-2xl p-6 mb-6">
              <Text className="text-white text-lg font-semibold mb-4">AI Insights</Text>
              
              <View className="space-y-4">
                <View 
                  className="p-4 rounded-xl border-l-4"
                  style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderLeftColor: neonColor 
                  }}
                >
                  <Text 
                    className="text-sm font-semibold mb-2"
                    style={{ color: neonColor }}
                  >
                    💡 Strength Spotlight
                  </Text>
                  <Text className="text-white text-sm">
                    Your communication scores have improved significantly this month. This suggests your twin bond is strengthening through better understanding and expression.
                  </Text>
                </View>
                
                <View 
                  className="p-4 rounded-xl border-l-4"
                  style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderLeftColor: '#f59e0b' 
                  }}
                >
                  <Text className="text-yellow-400 text-sm font-semibold mb-2">
                    🎯 Growth Opportunity
                  </Text>
                  <Text className="text-white text-sm">
                    Consider focusing on individual identity development. Balanced independence can actually strengthen your twin connection.
                  </Text>
                </View>
                
                <View 
                  className="p-4 rounded-xl border-l-4"
                  style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderLeftColor: '#10b981' 
                  }}
                >
                  <Text className="text-green-400 text-sm font-semibold mb-2">
                    🌟 Recommendation
                  </Text>
                  <Text className="text-white text-sm">
                    Your consistency streak is impressive! Try the "Twin Reflection" exercise this week to maintain momentum.
                  </Text>
                </View>
              </View>
            </View>
          </PremiumGatedContent>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};