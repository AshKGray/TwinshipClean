import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useResearchStore } from '../../state/researchStore';
import { useTwinStore } from '../../state/twinStore';
import { ResearchStudy } from '../../types/research';

export const ResearchParticipationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { userProfile } = useTwinStore();
  const {
    availableStudies,
    participation,
    isLoading,
    error,
    loadAvailableStudies,
    loadParticipation,
    withdrawFromStudy
  } = useResearchStore();

  useEffect(() => {
    if (userProfile) {
      loadAvailableStudies();
      loadParticipation(userProfile.id);
    }
  }, [userProfile]);

  const handleJoinStudy = (study: ResearchStudy) => {
    navigation.navigate('ConsentScreen' as never, { studyId: study.id } as never);
  };

  const handleWithdrawFromStudy = (studyId: string, studyTitle: string) => {
    Alert.alert(
      'Withdraw from Study',
      `Are you sure you want to withdraw from "${studyTitle}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: () => showWithdrawalOptions(studyId)
        }
      ]
    );
  };

  const showWithdrawalOptions = (studyId: string) => {
    Alert.alert(
      'Data Management',
      'What would you like us to do with your contributed data?',
      [
        {
          text: 'Delete All My Data',
          onPress: () => processWithdrawal(studyId, 'delete')
        },
        {
          text: 'Keep Anonymized Data',
          onPress: () => processWithdrawal(studyId, 'anonymize')
        },
        {
          text: 'Use in Aggregated Results',
          onPress: () => processWithdrawal(studyId, 'retain_aggregated')
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const processWithdrawal = async (studyId: string, dataDisposition: 'delete' | 'anonymize' | 'retain_aggregated') => {
    if (!userProfile) return;

    try {
      await withdrawFromStudy(
        userProfile.id,
        studyId,
        'User requested withdrawal',
        dataDisposition
      );

      Alert.alert(
        'Withdrawal Processed',
        'You have been successfully withdrawn from the study. Thank you for your contribution to research.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process withdrawal. Please try again.');
    }
  };

  const getCategoryIcon = (category: ResearchStudy['category']) => {
    switch (category) {
      case 'synchronicity': return 'flash';
      case 'psychology': return 'brain';
      case 'genetics': return 'dna';
      case 'behavior': return 'trending-up';
      case 'communication': return 'chatbubbles';
      default: return 'flask';
    }
  };

  const getCategoryColor = (category: ResearchStudy['category']) => {
    switch (category) {
      case 'synchronicity': return '#8b5cf6';
      case 'psychology': return '#06b6d4';
      case 'genetics': return '#10b981';
      case 'behavior': return '#f59e0b';
      case 'communication': return '#ec4899';
      default: return '#6b7280';
    }
  };

  const isParticipating = (studyId: string) => {
    return participation?.activeStudies.includes(studyId) || false;
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
                  loadAvailableStudies();
                  loadParticipation(userProfile.id);
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

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6">
          {/* Header */}
          <View className="py-6">
            <Text className="text-white text-3xl font-bold text-center mb-2">
              Research Participation
            </Text>
            <Text className="text-white/70 text-center text-lg">
              Contribute to groundbreaking twin research
            </Text>
          </View>

          {/* Participation Status */}
          {participation && (
            <View className="bg-white/10 rounded-xl p-6 mb-6">
              <Text className="text-white text-xl font-semibold mb-4">Your Participation</Text>
              
              <View className="space-y-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-white/70">Active Studies</Text>
                  <Text className="text-white font-semibold">
                    {participation.activeStudies.length}
                  </Text>
                </View>
                
                <View className="flex-row items-center justify-between">
                  <Text className="text-white/70">Total Contributions</Text>
                  <Text className="text-white font-semibold">
                    {participation.dataContributions.length}
                  </Text>
                </View>
                
                <View className="flex-row items-center justify-between">
                  <Text className="text-white/70">Research Since</Text>
                  <Text className="text-white font-semibold">
                    {new Date(participation.joinedAt).getFullYear()}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => navigation.navigate('ResearchDashboardScreen' as never)}
                className="bg-purple-500 py-3 rounded-lg mt-4"
              >
                <Text className="text-white font-semibold text-center">
                  View Your Dashboard
                </Text>
              </Pressable>
            </View>
          )}

          {/* Available Studies */}
          <View className="mb-6">
            <Text className="text-white text-xl font-semibold mb-4">Available Studies</Text>
            
            {isLoading ? (
              <View className="bg-white/5 rounded-xl p-8 items-center">
                <Text className="text-white/70">Loading studies...</Text>
              </View>
            ) : (
              <View className="space-y-4">
                {availableStudies.map((study) => (
                  <View key={study.id} className="bg-white/10 rounded-xl p-6">
                    {/* Study Header */}
                    <View className="flex-row items-start justify-between mb-4">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-2">
                          <View 
                            className="w-8 h-8 rounded-full items-center justify-center mr-3"
                            style={{ backgroundColor: getCategoryColor(study.category) + '20' }}
                          >
                            <Ionicons 
                              name={getCategoryIcon(study.category)} 
                              size={16} 
                              color={getCategoryColor(study.category)} 
                            />
                          </View>
                          <Text className="text-white text-lg font-semibold flex-1">
                            {study.title}
                          </Text>
                        </View>
                        
                        <Text className="text-white/70 text-sm leading-5 mb-3">
                          {study.description}
                        </Text>
                      </View>
                    </View>

                    {/* Study Details */}
                    <View className="space-y-2 mb-4">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Ionicons name="time" size={16} color="rgba(255,255,255,0.7)" />
                          <Text className="text-white/70 text-sm ml-2">{study.duration}</Text>
                        </View>
                        
                        <View className="flex-row items-center">
                          <Ionicons name="people" size={16} color="rgba(255,255,255,0.7)" />
                          <Text className="text-white/70 text-sm ml-2">
                            {study.participants} participants
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center">
                        <Ionicons name="business" size={16} color="rgba(255,255,255,0.7)" />
                        <Text className="text-white/70 text-sm ml-2">{study.institution}</Text>
                      </View>
                    </View>

                    {/* Compensation */}
                    <View className="bg-purple-500/20 rounded-lg p-3 mb-4">
                      <Text className="text-purple-300 text-sm font-medium mb-1">
                        What you receive:
                      </Text>
                      <View className="space-y-1">
                        {study.compensation.map((benefit, index) => (
                          <Text key={index} className="text-purple-200 text-sm">
                            • {benefit}
                          </Text>
                        ))}
                      </View>
                    </View>

                    {/* Action Button */}
                    {isParticipating(study.id) ? (
                      <View className="space-y-2">
                        <View className="bg-green-500/20 rounded-lg p-3">
                          <View className="flex-row items-center justify-center">
                            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                            <Text className="text-green-300 font-semibold ml-2">
                              Currently Participating
                            </Text>
                          </View>
                        </View>
                        
                        <Pressable
                          onPress={() => handleWithdrawFromStudy(study.id, study.title)}
                          className="bg-red-500/20 border border-red-500/30 py-2 rounded-lg"
                        >
                          <Text className="text-red-300 font-medium text-center text-sm">
                            Withdraw from Study
                          </Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => handleJoinStudy(study)}
                        className="bg-purple-500 py-3 rounded-lg"
                      >
                        <Text className="text-white font-semibold text-center">
                          Learn More & Join
                        </Text>
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Research Impact */}
          <View className="bg-white/5 rounded-xl p-6 mb-8">
            <Text className="text-white text-lg font-semibold mb-4">
              Why Your Participation Matters
            </Text>
            
            <View className="space-y-4">
              <View className="flex-row items-start">
                <View className="w-8 h-8 rounded-full bg-blue-500/20 items-center justify-center mr-4">
                  <Ionicons name="bulb" size={16} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium mb-1">Advance Science</Text>
                  <Text className="text-white/70 text-sm">
                    Help researchers understand the unique bond between twins
                  </Text>
                </View>
              </View>
              
              <View className="flex-row items-start">
                <View className="w-8 h-8 rounded-full bg-green-500/20 items-center justify-center mr-4">
                  <Ionicons name="people" size={16} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium mb-1">Help Other Twins</Text>
                  <Text className="text-white/70 text-sm">
                    Your data helps develop better support for twin relationships
                  </Text>
                </View>
              </View>
              
              <View className="flex-row items-start">
                <View className="w-8 h-8 rounded-full bg-purple-500/20 items-center justify-center mr-4">
                  <Ionicons name="eye" size={16} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium mb-1">Gain Insights</Text>
                  <Text className="text-white/70 text-sm">
                    Receive personalized insights about your twin connection
                  </Text>
                </View>
              </View>
              
              <View className="flex-row items-start">
                <View className="w-8 h-8 rounded-full bg-amber-500/20 items-center justify-center mr-4">
                  <Ionicons name="shield-checkmark" size={16} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium mb-1">Full Privacy</Text>
                  <Text className="text-white/70 text-sm">
                    All data is anonymized and handled according to research ethics
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};