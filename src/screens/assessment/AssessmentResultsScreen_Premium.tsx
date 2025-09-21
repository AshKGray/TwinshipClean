import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Import new premium components
import { PremiumGatedContent } from '../../components/premium/PremiumGatedContent';
import { PremiumBadge, PremiumUpgradeButton } from '../../components/premium/PremiumBadge';
import { PremiumStatusIndicator } from '../../components/premium/PremiumStatusIndicator';
import { PremiumFeatureTeaser } from '../../components/premium/PremiumFeatureTeaser';

// Import hooks and utilities
import { useAssessmentPremium } from '../../hooks/usePremiumFeatures';
import { pdfExportService } from '../../utils/pdfExportService';
import { PREMIUM_FEATURES } from '../../types/premium/subscription';

// Import existing components
import { useTwinStore } from '../../state/twinStore';
import { useAssessmentStore } from '../../state/assessmentStore';
import { getNeonAccentColor } from '../../utils/neonColors';

const { width } = Dimensions.get('window');

// Enhanced Circular Progress with premium styling
const CircularProgress = ({ 
  value, 
  maxValue = 100, 
  size = 120, 
  strokeWidth = 12,
  color = '#a855f7',
  label = '',
  isPremium = false
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / maxValue) * circumference;

  return (
    <View className="items-center">
      <View style={{ width: size, height: size }}>
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-white text-2xl font-bold">{Math.round(value)}</Text>
          <Text className="text-white/60 text-xs">{label}</Text>
          {isPremium && (
            <View className="absolute -top-2 -right-2">
              <PremiumBadge featureId="detailed_results" size="small" />
            </View>
          )}
        </View>
        <View 
          style={{ 
            transform: [{ rotate: '-90deg' }],
            width: size,
            height: size
          }}
        >
          {/* Background circle */}
          <View
            className="absolute"
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: isPremium ? `${color}30` : 'rgba(255,255,255,0.1)'
            }}
          />
          {/* Progress circle */}
          <View
            className="absolute"
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              borderTopColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: 'transparent',
              transform: [{ 
                rotate: `${(progress / circumference) * 360}deg` 
              }]
            }}
          />
        </View>
      </View>
    </View>
  );
};

export const AssessmentResultsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { userProfile, twinProfile } = useTwinStore();
  const { getResultsById } = useAssessmentStore();
  
  // Use the new premium hook
  const {
    canViewDetailedResults,
    canExportPDF,
    canAccessCoaching,
    canViewAnalytics,
    canGetRecommendations,
    requireDetailedResults,
    requirePDFExport,
    requireCoachingPlans,
    navigateToUpgrade,
    trackConversionEvent
  } = useAssessmentPremium();
  
  const [isExporting, setIsExporting] = useState(false);
  
  const themeColor = userProfile?.accentColor || 'neon-purple';
  const neonColor = getNeonAccentColor(themeColor);
  const sessionId = route.params?.sessionId;
  const results = getResultsById(sessionId);

  useEffect(() => {
    // Track that user viewed results
    trackConversionEvent('assessment_results_viewed', { sessionId });
  }, [sessionId]);

  if (!results) {
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 items-center justify-center">
          <Text className="text-white text-lg">Results not found</Text>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  const ci = results.compositeScores.find(s => s.index === 'CI')?.value || 0;
  const ari = results.compositeScores.find(s => s.index === 'ARI')?.value || 0;
  const trs = results.compositeScores.find(s => s.index === 'TRS')?.value || 0;

  const handleViewDetails = () => {
    if (!requireDetailedResults(() => navigateToUpgrade('detailed_results', 'assessment_details'))) {
      return;
    }
    navigation.navigate('AssessmentDetails', { sessionId });
  };

  const handleExportPDF = async () => {
    if (!requirePDFExport(() => navigateToUpgrade('pdf_export', 'export_button'))) {
      return;
    }

    try {
      setIsExporting(true);
      trackConversionEvent('pdf_export_initiated', { sessionId });
      
      const assessmentResults = {
        personalityScores: results.personalityScores.reduce((acc, score) => {
          acc[score.trait] = score.value;
          return acc;
        }, {} as Record<string, number>),
        twinDynamics: {
          codependencyIndex: ci,
          autonomyScore: ari,
          transitionRisk: trs
        },
        recommendations: results.recommendations.map(r => r.description),
        timestamp: results.timestamp,
        userProfile: {
          name: userProfile?.name || 'User',
          twinType: userProfile?.twinType || 'unknown'
        },
        twinProfile: twinProfile ? {
          name: twinProfile.name
        } : undefined
      };

      await pdfExportService.shareAssessmentPDF(assessmentResults, {
        format: 'detailed',
        includeRecommendations: true,
        includeTwinComparison: !!twinProfile
      });

      trackConversionEvent('pdf_export_completed', { sessionId });
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export PDF. Please try again.');
      trackConversionEvent('pdf_export_failed', { sessionId, error: error.message });
    } finally {
      setIsExporting(false);
    }
  };

  const handleViewRecommendations = () => {
    if (!requireCoachingPlans(() => navigateToUpgrade('coaching_plans', 'recommendations_button'))) {
      return;
    }
    navigation.navigate('AssessmentRecommendations', { sessionId, results });
  };

  const detailedResultsFeature = PREMIUM_FEATURES.find(f => f.id === 'detailed_results')!;
  const coachingFeature = PREMIUM_FEATURES.find(f => f.id === 'coaching_plans')!;
  const pdfFeature = PREMIUM_FEATURES.find(f => f.id === 'pdf_export')!;

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6">
          {/* Header with Premium Status */}
          <View className="flex-row items-center justify-between pt-4 pb-6">
            <Pressable onPress={() => navigation.navigate('Home')}>
              <Ionicons name="close" size={24} color="white" />
            </Pressable>
            <View className="flex-1 items-center">
              <Text className="text-white text-xl font-semibold">Your Results</Text>
              <View className="mt-1">
                <PremiumStatusIndicator variant="minimal" />
              </View>
            </View>
            <View className="flex-row space-x-2">
              {canExportPDF ? (
                <Pressable onPress={handleExportPDF} disabled={isExporting}>
                  <Ionicons 
                    name="download-outline" 
                    size={24} 
                    color={isExporting ? "#6b7280" : "white"} 
                  />
                </Pressable>
              ) : (
                <PremiumBadge 
                  featureId="pdf_export" 
                  variant="icon" 
                  onPress={() => navigateToUpgrade('pdf_export', 'header_icon')}
                />
              )}
              <Pressable onPress={() => {/* Share logic */}}>
                <Ionicons name="share-outline" size={24} color="white" />
              </Pressable>
            </View>
          </View>

          {/* Overall Profile */}
          <View className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <Text className="text-white text-lg font-semibold mb-3">Your Twin Profile</Text>
            <Text className="text-white/80 leading-relaxed">
              {results.overallProfile}
            </Text>
          </View>

          {/* Composite Scores - Premium Gated */}
          <PremiumGatedContent
            featureId="detailed_results"
            gateType="teaser"
            onUpgradeRequest={() => navigateToUpgrade('detailed_results', 'composite_scores')}
          >
            <View className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-lg font-semibold">Key Indices</Text>
                {canViewDetailedResults && (
                  <PremiumBadge featureId="detailed_results" variant="badge" showText={false} />
                )}
              </View>
              
              <View className="flex-row justify-around mb-4">
                <CircularProgress
                  value={ci}
                  color="#10b981"
                  label="CI"
                  size={100}
                  isPremium={canViewDetailedResults}
                />
                <CircularProgress
                  value={ari}
                  color="#3b82f6"
                  label="ARI"
                  size={100}
                  isPremium={canViewDetailedResults}
                />
                <CircularProgress
                  value={trs}
                  color="#f59e0b"
                  label="TRS"
                  size={100}
                  isPremium={canViewDetailedResults}
                />
              </View>

              {canViewDetailedResults && (
                <View className="space-y-3 mt-4">
                  <View>
                    <Text className="text-green-400 font-medium">Codependency Index (CI)</Text>
                    <Text className="text-white/60 text-sm">
                      {results.compositeScores.find(s => s.index === 'CI')?.interpretation}
                    </Text>
                  </View>
                  <View className="mt-3">
                    <Text className="text-blue-400 font-medium">Autonomy & Resilience (ARI)</Text>
                    <Text className="text-white/60 text-sm">
                      {results.compositeScores.find(s => s.index === 'ARI')?.interpretation}
                    </Text>
                  </View>
                  <View className="mt-3">
                    <Text className="text-yellow-400 font-medium">Transition Risk (TRS)</Text>
                    <Text className="text-white/60 text-sm">
                      {results.compositeScores.find(s => s.index === 'TRS')?.interpretation}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </PremiumGatedContent>

          {/* Recommendations Section */}
          <View className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-lg font-semibold">Your Recommendations</Text>
              {!canGetRecommendations && (
                <PremiumBadge featureId="recommendations" variant="button" size="small" />
              )}
            </View>
            
            {/* Show first recommendation as teaser */}
            {results.recommendations.length > 0 && (
              <View className="bg-white/5 rounded-xl p-4 mb-4">
                <View className="flex-row items-start">
                  <View className={`w-2 h-2 rounded-full mt-2 ${
                    results.recommendations[0].priority === 'high' 
                      ? 'bg-red-400' 
                      : results.recommendations[0].priority === 'medium'
                      ? 'bg-yellow-400'
                      : 'bg-green-400'
                  }`} />
                  <View className="ml-3 flex-1">
                    <Text className="text-white font-medium">
                      {results.recommendations[0].title}
                    </Text>
                    <Text className="text-white/60 text-sm mt-1">
                      {results.recommendations[0].description}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Premium gate for additional recommendations */}
            {!canGetRecommendations && results.recommendations.length > 1 && (
              <PremiumFeatureTeaser
                feature={coachingFeature}
                onUpgrade={() => navigateToUpgrade('coaching_plans', 'recommendations_teaser')}
                customMessage={`Unlock ${results.recommendations.length - 1} more personalized recommendations and weekly micro-experiments`}
                showPreview={false}
              >
                <View className="bg-purple-500/20 rounded-xl p-3">
                  <Text className="text-purple-300 text-sm text-center">
                    🔒 {results.recommendations.length - 1} more recommendations available
                  </Text>
                </View>
              </PremiumFeatureTeaser>
            )}
          </View>

          {/* Action Buttons */}
          <View className="mb-8 space-y-3">
            {/* Primary CTA based on subscription status */}
            {canViewDetailedResults ? (
              <Pressable
                onPress={handleViewDetails}
                style={{ backgroundColor: neonColor }}
                className="rounded-xl p-4"
              >
                <Text className="text-black text-center font-semibold text-lg">
                  View Detailed Analysis
                </Text>
              </Pressable>
            ) : (
              <PremiumUpgradeButton
                featureId="detailed_results"
                onUpgrade={() => navigateToUpgrade('detailed_results', 'primary_cta')}
                text="Unlock Full Results & Coaching"
              />
            )}

            {/* Secondary actions */}
            <View className="flex-row space-x-3">
              {canAccessCoaching ? (
                <Pressable
                  onPress={handleViewRecommendations}
                  className="flex-1 bg-white/10 rounded-xl p-3"
                >
                  <Text className="text-white text-center font-medium">
                    Weekly Coaching
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => navigateToUpgrade('coaching_plans', 'coaching_button')}
                  className="flex-1 bg-white/10 rounded-xl p-3 border border-gray-600"
                >
                  <View className="flex-row items-center justify-center">
                    <Ionicons name="lock-closed" size={16} color="#6b7280" />
                    <Text className="text-gray-400 text-center font-medium ml-2">
                      Coaching
                    </Text>
                  </View>
                </Pressable>
              )}

              {canExportPDF ? (
                <Pressable
                  onPress={handleExportPDF}
                  disabled={isExporting}
                  className="flex-1 bg-white/10 rounded-xl p-3"
                >
                  <Text className="text-white text-center font-medium">
                    {isExporting ? 'Exporting...' : 'Export PDF'}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => navigateToUpgrade('pdf_export', 'export_button')}
                  className="flex-1 bg-white/10 rounded-xl p-3 border border-gray-600"
                >
                  <View className="flex-row items-center justify-center">
                    <Ionicons name="lock-closed" size={16} color="#6b7280" />
                    <Text className="text-gray-400 text-center font-medium ml-2">
                      Export
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>

            {/* Return home button */}
            <Pressable
              onPress={() => navigation.navigate('Home')}
              className="bg-white/5 rounded-xl p-4"
            >
              <Text className="text-white/80 text-center font-medium">
                Return Home
              </Text>
            </Pressable>
          </View>

          {/* Share with Twin */}
          {userProfile?.twinId && (
            <View className="bg-blue-500/10 rounded-xl p-4 mb-4">
              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={20} color="rgba(147, 197, 253, 0.8)" />
                <View className="ml-3 flex-1">
                  <Text className="text-blue-300 font-medium">Share with your twin</Text>
                  <Text className="text-blue-200/60 text-xs mt-1">
                    Compare results when both complete the assessment
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};