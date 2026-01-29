/**
 * Contribution Tracking Screen
 * Story: 5-2 Research Data Contribution Tracking
 *
 * Shows what data has been contributed, allows opt-in/out per data type
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useResearchStore } from '../../state/researchStore';
import { useTwinStore } from '../../state/twinStore';
import { researchDataService } from '../../services/researchDataService';

type DataType = 'game' | 'twintuition' | 'twincidence' | 'assessment' | 'communication';

interface DataTypeConfig {
  type: DataType;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export const ContributionTrackingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { userProfile } = useTwinStore();
  const { participation } = useResearchStore();

  const [dataTypeConfig, setDataTypeConfig] = useState<DataTypeConfig[]>([
    {
      type: 'game',
      label: 'Game Results',
      description: 'Psychic game scores and synchronicity patterns (no personal details)',
      icon: 'game-controller',
      enabled: true,
    },
    {
      type: 'twintuition',
      label: 'Twintuition Alerts',
      description: 'Alert patterns and timing (no message content)',
      icon: 'flash',
      enabled: true,
    },
    {
      type: 'twincidence',
      label: 'Twincidences',
      description: 'Coincidence categories and patterns (no descriptions or media)',
      icon: 'sync',
      enabled: true,
    },
    {
      type: 'assessment',
      label: 'Assessment Scores',
      description: 'Aggregate scores only (no specific answers)',
      icon: 'clipboard',
      enabled: false,
    },
    {
      type: 'communication',
      label: 'Communication Patterns',
      description: 'Timing and frequency only (NEVER message content)',
      icon: 'chatbubbles',
      enabled: false,
    },
  ]);

  const [stats, setStats] = useState<{
    totalSubmissions: number;
    lastSubmission: string | null;
    dataTypes: string[];
    contributionScore: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContributionStats();
  }, [userProfile, participation]);

  const loadContributionStats = async () => {
    if (!userProfile || !participation?.activeStudies.length) {
      setIsLoading(false);
      return;
    }

    try {
      const studyId = participation.activeStudies[0];
      const contributionStats = await researchDataService.getContributionStats(
        userProfile.id,
        studyId
      );

      setStats(contributionStats);
    } catch (error) {
      console.error('Error loading contribution stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDataType = (type: DataType) => {
    setDataTypeConfig(prev =>
      prev.map(config =>
        config.type === type ? { ...config, enabled: !config.enabled } : config
      )
    );
  };

  const handleRequestDataDeletion = () => {
    Alert.alert(
      'Request Data Deletion',
      'This will request deletion of all your anonymized research data. This action cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Deletion',
          style: 'destructive',
          onPress: async () => {
            if (!userProfile || !participation?.activeStudies.length) return;

            try {
              const studyId = participation.activeStudies[0];
              await researchDataService.requestDataDeletion(userProfile.id, studyId);

              Alert.alert(
                'Deletion Requested',
                'Your data deletion request has been submitted. All anonymized data will be removed within 30 days.'
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to submit deletion request. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleProcessQueue = async () => {
    try {
      await researchDataService.processSubmissionQueue();
      Alert.alert('Success', 'All pending contributions have been submitted.');
      loadContributionStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to process pending contributions.');
    }
  };

  if (isLoading) {
    return (
      <ImageBackground source={require("../../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 justify-center items-center">
          <View className="bg-white/10 rounded-xl p-8">
            <Text className="text-white text-lg text-center">Loading contribution data...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (!participation?.activeStudies.length) {
    return (
      <ImageBackground source={require("../../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          <View className="p-6 flex-1 justify-center">
            <View className="bg-white/10 rounded-xl p-8">
              <Ionicons name="flask" size={64} color="rgba(255,255,255,0.5)" style={{ alignSelf: 'center', marginBottom: 16 }} />
              <Text className="text-white text-xl font-bold text-center mb-4">
                No Active Studies
              </Text>
              <Text className="text-white/70 text-center mb-6">
                Join a research study to start contributing data and tracking your impact.
              </Text>
              <Pressable
                onPress={() => navigation.navigate('ResearchParticipationScreen' as never)}
                className="bg-purple-500 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold text-center">Browse Studies</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require("../../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6">
          {/* Header */}
          <View className="py-6">
            <Text className="text-white text-3xl font-bold text-center mb-2">
              Contribution Tracking
            </Text>
            <Text className="text-white/70 text-center text-lg">
              Manage your research data contributions
            </Text>
          </View>

          {/* Stats Overview */}
          {stats && (
            <View className="bg-white/10 rounded-xl p-6 mb-6">
              <Text className="text-white text-xl font-semibold mb-4">Your Contributions</Text>

              <View className="flex-row justify-between mb-4">
                <View className="flex-1 bg-white/5 rounded-lg p-4 mr-2">
                  <Text className="text-white font-semibold text-2xl">
                    {stats.totalSubmissions}
                  </Text>
                  <Text className="text-white/70 text-sm">Data Points</Text>
                </View>

                <View className="flex-1 bg-white/5 rounded-lg p-4 ml-2">
                  <Text className="text-white font-semibold text-2xl">
                    {stats.dataTypes.length}
                  </Text>
                  <Text className="text-white/70 text-sm">Data Types</Text>
                </View>
              </View>

              <View className="bg-white/5 rounded-lg p-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white font-medium">Contribution Score</Text>
                  <Text className="text-purple-300 font-bold text-xl">
                    {stats.contributionScore}
                  </Text>
                </View>
                <View className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-purple-500"
                    style={{ width: `${Math.min((stats.contributionScore / 1000) * 100, 100)}%` }}
                  />
                </View>
              </View>

              {stats.lastSubmission && (
                <Text className="text-white/50 text-sm mt-4 text-center">
                  Last submission: {new Date(stats.lastSubmission).toLocaleDateString()}
                </Text>
              )}
            </View>
          )}

          {/* Data Type Controls */}
          <View className="mb-6">
            <Text className="text-white text-xl font-semibold mb-4">Data Types</Text>
            <Text className="text-white/70 text-sm mb-4">
              Control which types of data you contribute to research. All data is fully anonymized.
            </Text>

            <View className="space-y-4">
              {dataTypeConfig.map((config) => (
                <View key={config.type} className="bg-white/10 rounded-xl p-4">
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-row items-center flex-1 mr-4">
                      <View className="bg-purple-500/20 rounded-full p-2 mr-3">
                        <Ionicons name={config.icon as any} size={20} color="#a78bfa" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-semibold mb-1">
                          {config.label}
                        </Text>
                        <Text className="text-white/70 text-sm leading-5">
                          {config.description}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={config.enabled}
                      onValueChange={() => toggleDataType(config.type)}
                      trackColor={{ false: '#374151', true: '#8b5cf6' }}
                      thumbColor={config.enabled ? '#ffffff' : '#9ca3af'}
                    />
                  </View>

                  {stats && stats.dataTypes.includes(config.type) && (
                    <View className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 mt-2">
                      <Text className="text-green-300 text-xs text-center">
                        ✓ Contributing this data type
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Privacy Notice */}
          <View className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
            <View className="flex-row items-start">
              <Ionicons name="shield-checkmark" size={24} color="#60a5fa" />
              <View className="flex-1 ml-3">
                <Text className="text-blue-300 font-semibold mb-2">Privacy Guaranteed</Text>
                <Text className="text-white/80 text-sm leading-5">
                  • All data is fully anonymized before submission{'\n'}
                  • No personal identifying information is shared{'\n'}
                  • You can request deletion at any time{'\n'}
                  • Data is only used for academic research
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View className="mb-8 space-y-3">
            <Pressable
              onPress={handleProcessQueue}
              className="bg-purple-500 py-4 rounded-xl"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="cloud-upload" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">
                  Submit Pending Contributions
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('PopulationInsightsScreen' as never)}
              className="bg-white/20 py-4 rounded-xl"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="bar-chart" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">
                  View Population Insights
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={handleRequestDataDeletion}
              className="bg-red-500/20 border border-red-500/30 py-4 rounded-xl"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="trash" size={20} color="#ef4444" />
                <Text className="text-red-300 font-semibold ml-2">
                  Request Data Deletion
                </Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};
