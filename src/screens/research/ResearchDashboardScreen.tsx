import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Share, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useResearchStore } from '../../state/researchStore';
import { useTwinStore } from '../../state/twinStore';

export const ResearchDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { userProfile } = useTwinStore();
  const {
    dashboard,
    insights,
    participation,
    isLoading,
    error,
    loadDashboard,
    loadInsights,
    exportData
  } = useResearchStore();

  useEffect(() => {
    if (userProfile) {
      loadDashboard(userProfile.id);
      loadInsights(userProfile.id);
    }
  }, [userProfile]);

  const handleExportData = async () => {
    if (!userProfile) return;

    Alert.alert(
      'Export Your Data',
      'This will create a complete export of your research participation data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            try {
              const data = await exportData(userProfile.id);
              const jsonData = JSON.stringify(data, null, 2);
              
              // In a real app, you might save to device or email
              Share.share({
                message: 'Your Twinship research data export',
                title: 'Research Data Export'
              });
              
              Alert.alert(
                'Export Complete',
                'Your data has been prepared for export. You can now share or save it.'
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to export data. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getImpactLevel = (score: number): { level: string; color: string; icon: string } => {
    if (score >= 80) return { level: 'High Impact', color: '#10b981', icon: 'trending-up' };
    if (score >= 50) return { level: 'Good Impact', color: '#3b82f6', icon: 'trending-up' };
    if (score >= 20) return { level: 'Growing Impact', color: '#f59e0b', icon: 'trending-up' };
    return { level: 'Starting Impact', color: '#6b7280', icon: 'trending-up' };
  };

  if (error) {
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 justify-center items-center p-6">
          <View className="bg-red-500/20 border border-red-500/30 rounded-xl p-6">
            <Text className="text-red-300 text-center text-lg mb-4">{error}</Text>
            <Pressable
              onPress={() => {
                if (userProfile) {
                  loadDashboard(userProfile.id);
                  loadInsights(userProfile.id);
                }
              }}
              className="bg-red-500 py-3 px-6 rounded-lg"
            >
              <Text className="text-white font-semibold text-center">Retry</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (isLoading || !dashboard) {
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 justify-center items-center">
          <View className="bg-white/10 rounded-xl p-8">
            <Text className="text-white text-lg text-center">Loading your dashboard...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  const impact = getImpactLevel(dashboard.impactMetrics.scientificImpact);

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6">
          {/* Header */}
          <View className="py-6">
            <Text className="text-white text-3xl font-bold text-center mb-2">
              Research Dashboard
            </Text>
            <Text className="text-white/70 text-center text-lg">
              Your contribution to twin science
            </Text>
          </View>

          {/* Impact Overview */}
          <View className="bg-white/10 rounded-xl p-6 mb-6">
            <Text className="text-white text-xl font-semibold mb-4">Your Impact</Text>
            
            <View className="bg-white/5 rounded-lg p-4 mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white font-medium">Scientific Impact Score</Text>
                <View className="flex-row items-center">
                  <Ionicons name={impact.icon} size={20} color={impact.color} />
                  <Text className="text-white font-bold text-lg ml-2">
                    {dashboard.impactMetrics.scientificImpact}/100
                  </Text>
                </View>
              </View>
              <Text className="text-white/70 text-sm" style={{ color: impact.color }}>
                {impact.level}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <View className="flex-1 bg-white/5 rounded-lg p-4 mr-2">
                <Text className="text-white font-semibold text-2xl">
                  {dashboard.impactMetrics.dataPointsContributed}
                </Text>
                <Text className="text-white/70 text-sm">Data Points</Text>
              </View>
              
              <View className="flex-1 bg-white/5 rounded-lg p-4 ml-2">
                <Text className="text-white font-semibold text-2xl">
                  {dashboard.impactMetrics.studiesSupported}
                </Text>
                <Text className="text-white/70 text-sm">Studies Supported</Text>
              </View>
            </View>
          </View>

          {/* Active Studies */}
          <View className="mb-6">
            <Text className="text-white text-xl font-semibold mb-4">Active Studies</Text>
            
            {dashboard.activeStudies.length > 0 ? (
              <View className="space-y-4">
                {dashboard.activeStudies.map((study) => (
                  <View key={study.id} className="bg-white/10 rounded-xl p-6">
                    <Text className="text-white text-lg font-semibold mb-2">
                      {study.title}
                    </Text>
                    <Text className="text-white/70 text-sm mb-3">
                      {study.description}
                    </Text>
                    
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Ionicons name="time" size={16} color="rgba(255,255,255,0.7)" />
                        <Text className="text-white/70 text-sm ml-2">{study.duration}</Text>
                      </View>
                      
                      <View className="flex-row items-center">
                        <Ionicons 
                          name="checkmark-circle" 
                          size={16} 
                          color="#10b981" 
                        />
                        <Text className="text-green-300 text-sm ml-2">Contributing</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-white/5 rounded-xl p-6">
                <Text className="text-white/70 text-center">
                  No active studies. Visit Research Participation to join studies.
                </Text>
                <Pressable
                  onPress={() => navigation.navigate('ResearchParticipationScreen' as never)}
                  className="bg-purple-500 py-3 rounded-lg mt-4"
                >
                  <Text className="text-white font-semibold text-center">
                    Browse Studies
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Recent Insights */}
          <View className="mb-6">
            <Text className="text-white text-xl font-semibold mb-4">Latest Research Insights</Text>
            
            {insights.length > 0 ? (
              <View className="space-y-4">
                {insights.slice(0, 3).map((insight) => (
                  <View key={insight.id} className="bg-white/10 rounded-xl p-6">
                    <View className="flex-row items-start justify-between mb-3">
                      <Text className="text-white text-lg font-semibold flex-1 mr-3">
                        {insight.title}
                      </Text>
                      <View className={`px-2 py-1 rounded ${
                        insight.significance === 'breakthrough' ? 'bg-green-500/20' :
                        insight.significance === 'significant' ? 'bg-blue-500/20' :
                        'bg-gray-500/20'
                      }`}>
                        <Text className={`text-xs font-medium ${
                          insight.significance === 'breakthrough' ? 'text-green-300' :
                          insight.significance === 'significant' ? 'text-blue-300' :
                          'text-gray-300'
                        }`}>
                          {insight.significance}
                        </Text>
                      </View>
                    </View>
                    
                    <Text className="text-white/70 text-sm mb-3">
                      {insight.summary}
                    </Text>
                    
                    <View className="space-y-2">
                      {insight.findings.slice(0, 2).map((finding, index) => (
                        <View key={index} className="flex-row items-start">
                          <Ionicons name="bulb" size={14} color="#fbbf24" />
                          <Text className="text-white/80 text-sm ml-2 flex-1">
                            {finding}
                          </Text>
                        </View>
                      ))}
                    </View>
                    
                    <Text className="text-white/50 text-xs mt-3">
                      Published {new Date(insight.publishedAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-white/5 rounded-xl p-6">
                <Text className="text-white/70 text-center">
                  Research insights will appear here as studies progress
                </Text>
              </View>
            )}
          </View>

          {/* Recognition & Milestones */}
          {(dashboard.recognitions.length > 0 || dashboard.upcomingMilestones.length > 0) && (
            <View className="mb-6">
              <Text className="text-white text-xl font-semibold mb-4">Recognition & Milestones</Text>
              
              {dashboard.recognitions.length > 0 && (
                <View className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 mb-4">
                  <Text className="text-white font-semibold mb-3">Your Achievements</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {dashboard.recognitions.map((recognition, index) => (
                      <View key={index} className="bg-white/20 px-3 py-2 rounded-full">
                        <Text className="text-white text-sm font-medium">
                          🏆 {recognition}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {dashboard.upcomingMilestones.length > 0 && (
                <View className="bg-white/5 rounded-xl p-6">
                  <Text className="text-white font-semibold mb-3">Upcoming Milestones</Text>
                  <View className="space-y-2">
                    {dashboard.upcomingMilestones.map((milestone, index) => (
                      <View key={index} className="flex-row items-center">
                        <Ionicons name="flag" size={16} color="#8b5cf6" />
                        <Text className="text-white/80 text-sm ml-3">{milestone}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Data Management */}
          <View className="mb-8">
            <Text className="text-white text-xl font-semibold mb-4">Data Management</Text>
            
            <View className="bg-white/10 rounded-xl p-6">
              <Text className="text-white font-medium mb-3">Your Data Rights</Text>
              <Text className="text-white/70 text-sm mb-4">
                You have full control over your research data. You can export, modify permissions, 
                or withdraw from studies at any time.
              </Text>
              
              <View className="space-y-3">
                <Pressable
                  onPress={handleExportData}
                  className="bg-blue-500 py-3 rounded-lg"
                >
                  <View className="flex-row items-center justify-center">
                    <Ionicons name="download" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">
                      Export My Data
                    </Text>
                  </View>
                </Pressable>
                
                <Pressable
                  onPress={() => navigation.navigate('ResearchParticipationScreen' as never)}
                  className="bg-white/20 py-3 rounded-lg"
                >
                  <View className="flex-row items-center justify-center">
                    <Ionicons name="settings" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">
                      Manage Participation
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};