import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTwinStore } from '../../state/twinStore';
import { useAssessmentStore } from '../../state/assessmentStore';

const { width } = Dimensions.get('window');

// Circular progress component
const CircularProgress = ({ 
  value, 
  maxValue = 100, 
  size = 120, 
  strokeWidth = 12,
  color = '#a855f7',
  label = ''
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
              borderColor: 'rgba(255,255,255,0.1)'
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
  const { userProfile } = useTwinStore();
  const { getResultsById, isPremium, markTeaserSeen, hasSeenTeaser } = useAssessmentStore();
  
  const [showPaywall, setShowPaywall] = useState(!isPremium && !hasSeenTeaser);
  
  const themeColor = userProfile?.accentColor || 'neon-purple';
  const sessionId = route.params?.sessionId;
  const results = getResultsById(sessionId);

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
    if (!isPremium) {
      setShowPaywall(true);
    } else {
      navigation.navigate('AssessmentDetails', { sessionId });
    }
  };

  const handleUnlockPremium = () => {
    markTeaserSeen();
    // Navigate to payment/subscription screen with source
    navigation.navigate('Premium', { source: 'assessment' });
  };

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6">
          {/* Header */}
          <View className="flex-row items-center justify-between pt-4 pb-6">
            <Pressable onPress={() => navigation.navigate('Main')}>
              <Ionicons name="close" size={24} color="white" />
            </Pressable>
            <Text className="text-white text-xl font-semibold">Your Results</Text>
            <Pressable onPress={() => navigation.navigate('Twinsettings')}>
              <Ionicons name="share-outline" size={24} color="white" />
            </Pressable>
          </View>

          {/* Overall Profile */}
          <View className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <Text className="text-white text-lg font-semibold mb-3">Your Twin Profile</Text>
            <Text className="text-white/80 leading-relaxed">
              {results.overallProfile}
            </Text>
          </View>

          {/* Composite Scores */}
          <View className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <Text className="text-white text-lg font-semibold mb-6">Key Indices</Text>
            
            <View className="flex-row justify-around mb-4">
              <CircularProgress
                value={ci}
                color="#10b981"
                label="CI"
                size={100}
              />
              <CircularProgress
                value={ari}
                color="#3b82f6"
                label="ARI"
                size={100}
              />
              <CircularProgress
                value={trs}
                color="#f59e0b"
                label="TRS"
                size={100}
              />
            </View>

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
          </View>

          {/* Top Recommendations (Teaser) */}
          <View className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <Text className="text-white text-lg font-semibold mb-4">Your Top Recommendation</Text>
            
            {results.recommendations.length > 0 && (
              <View className="bg-white/5 rounded-xl p-4">
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

            {!isPremium && (
              <View className="mt-4 bg-purple-500/20 rounded-xl p-3">
                <Text className="text-purple-300 text-sm text-center">
                  🔒 Unlock {results.recommendations.length - 1} more personalized recommendations
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View className="mb-8">
            {!isPremium ? (
              <>
                <Pressable
                  onPress={handleUnlockPremium}
                  className="bg-purple-500 rounded-xl p-4 mb-3"
                >
                  <Text className="text-white text-center font-semibold text-lg">
                    Unlock Full Results & Coaching
                  </Text>
                </Pressable>
                
                <Pressable
                  onPress={() => navigation.navigate('Main')}
                  className="bg-white/10 rounded-xl p-4"
                >
                  <Text className="text-white text-center font-medium">
                    Return Home
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  onPress={handleViewDetails}
                  className="bg-purple-500 rounded-xl p-4 mb-3"
                >
                  <Text className="text-white text-center font-semibold text-lg">
                    View Detailed Analysis
                  </Text>
                </Pressable>
                
                <Pressable
                  onPress={() => navigation.navigate('AssessmentRecommendations', { results: session })}
                  className="bg-white/10 rounded-xl p-4 mb-3"
                >
                  <Text className="text-white text-center font-medium">
                    Weekly Micro-Experiments
                  </Text>
                </Pressable>
                
                <Pressable
                  onPress={() => navigation.navigate('Main')}
                  className="bg-white/10 rounded-xl p-4"
                >
                  <Text className="text-white text-center font-medium">
                    Return Home
                  </Text>
                </Pressable>
              </>
            )}
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

        {/* Paywall Modal */}
        {showPaywall && !isPremium && (
          <View className="absolute inset-0 bg-black/80 items-center justify-center p-6">
            <View className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
              <Text className="text-white text-xl font-bold text-center mb-4">
                Unlock Your Full Twin Analysis
              </Text>
              
              <View className="space-y-3 mb-6">
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text className="text-white/80 ml-3">15 personality dimensions</Text>
                </View>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text className="text-white/80 ml-3">All recommendations</Text>
                </View>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text className="text-white/80 ml-3">Weekly micro-experiments</Text>
                </View>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text className="text-white/80 ml-3">Pair comparison analytics</Text>
                </View>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text className="text-white/80 ml-3">PDF export</Text>
                </View>
              </View>

              <Pressable
                onPress={handleUnlockPremium}
                className="bg-purple-500 rounded-xl p-4 mb-3"
              >
                <Text className="text-white text-center font-semibold">
                  Unlock Premium - $9.99
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setShowPaywall(false)}
                className="p-2"
              >
                <Text className="text-white/60 text-center">Maybe later</Text>
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
};