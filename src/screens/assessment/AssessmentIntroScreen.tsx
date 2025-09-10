import React from 'react';
import { View, Text, ScrollView, Pressable, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTwinStore } from '../../state/twinStore';
import { useAssessmentStore } from '../../state/assessmentStore';

export const AssessmentIntroScreen = () => {
  const navigation = useNavigation<any>();
  const { userProfile, twinProfile } = useTwinStore();
  const { startAssessment, sessions } = useAssessmentStore();
  
  const themeColor = userProfile?.accentColor || 'neon-purple';
  
  // Check if user has incomplete assessment
  const incompleteSession = sessions.find(
    s => s.userId === userProfile?.id && !s.isComplete
  );

  const handleStartAssessment = () => {
    if (userProfile) {
      startAssessment(userProfile.id, twinProfile?.id);
      navigation.navigate('AssessmentSurvey');
    }
  };

  const handleResumeAssessment = () => {
    if (incompleteSession) {
      useAssessmentStore.getState().resumeAssessment(incompleteSession.id);
      navigation.navigate('AssessmentSurvey');
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
            <Text className="text-white text-xl font-semibold">Twin Assessment</Text>
            <View className="w-6" />
          </View>

          {/* Hero Section */}
          <View className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <View className="items-center mb-4">
              <View className="bg-purple-500/30 rounded-full p-4 mb-4">
                <Ionicons name="analytics" size={48} color="white" />
              </View>
              <Text className="text-white text-2xl font-bold text-center">
                Discover Your Twin Dynamic
              </Text>
              <Text className="text-white/70 text-center mt-2">
                Research-grade assessment designed specifically for twins
              </Text>
            </View>
          </View>

          {/* What to Expect */}
          <View className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <Text className="text-white text-lg font-semibold mb-4">What to Expect</Text>
            
            <View className="space-y-3">
              <View className="flex-row items-start">
                <Ionicons name="time-outline" size={20} color="rgba(255,255,255,0.7)" />
                <View className="ml-3 flex-1">
                  <Text className="text-white font-medium">30-45 minutes</Text>
                  <Text className="text-white/60 text-sm">210 questions about your twin relationship</Text>
                </View>
              </View>

              <View className="flex-row items-start mt-3">
                <Ionicons name="save-outline" size={20} color="rgba(255,255,255,0.7)" />
                <View className="ml-3 flex-1">
                  <Text className="text-white font-medium">Auto-save progress</Text>
                  <Text className="text-white/60 text-sm">Take breaks and resume anytime</Text>
                </View>
              </View>

              <View className="flex-row items-start mt-3">
                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.7)" />
                <View className="ml-3 flex-1">
                  <Text className="text-white font-medium">Private & secure</Text>
                  <Text className="text-white/60 text-sm">Your data stays on your device by default</Text>
                </View>
              </View>

              <View className="flex-row items-start mt-3">
                <Ionicons name="bar-chart-outline" size={20} color="rgba(255,255,255,0.7)" />
                <View className="ml-3 flex-1">
                  <Text className="text-white font-medium">Comprehensive results</Text>
                  <Text className="text-white/60 text-sm">15 personality dimensions + 3 composite indices</Text>
                </View>
              </View>
            </View>
          </View>

          {/* What You'll Learn */}
          <View className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <Text className="text-white text-lg font-semibold mb-4">What You'll Learn</Text>
            
            <View className="space-y-2">
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-green-400 rounded-full" />
                <Text className="text-white/80 ml-3 flex-1">Your Codependency Index (CI)</Text>
              </View>
              <View className="flex-row items-center mt-2">
                <View className="w-2 h-2 bg-blue-400 rounded-full" />
                <Text className="text-white/80 ml-3 flex-1">Autonomy & Resilience Index (ARI)</Text>
              </View>
              <View className="flex-row items-center mt-2">
                <View className="w-2 h-2 bg-yellow-400 rounded-full" />
                <Text className="text-white/80 ml-3 flex-1">Transition Risk Score (TRS)</Text>
              </View>
              <View className="flex-row items-center mt-2">
                <View className="w-2 h-2 bg-purple-400 rounded-full" />
                <Text className="text-white/80 ml-3 flex-1">Personalized recommendations</Text>
              </View>
              <View className="flex-row items-center mt-2">
                <View className="w-2 h-2 bg-pink-400 rounded-full" />
                <Text className="text-white/80 ml-3 flex-1">Weekly micro-experiments</Text>
              </View>
            </View>
          </View>

          {/* Privacy Notice */}
          <View className="bg-blue-500/20 rounded-xl p-4 mb-6">
            <View className="flex-row items-start">
              <Ionicons name="shield-checkmark" size={20} color="rgba(147, 197, 253, 1)" />
              <View className="ml-3 flex-1">
                <Text className="text-blue-300 font-medium">Privacy First</Text>
                <Text className="text-blue-200/80 text-sm mt-1">
                  This assessment is not diagnostic. Your responses are stored locally and never shared without your explicit consent.
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="mb-8">
            {incompleteSession ? (
              <>
                <Pressable
                  onPress={handleResumeAssessment}
                  className="bg-purple-500 rounded-xl p-4 mb-3"
                >
                  <Text className="text-white text-center font-semibold text-lg">
                    Resume Assessment ({Math.round(incompleteSession.currentProgress)}% complete)
                  </Text>
                </Pressable>
                
                <Pressable
                  onPress={handleStartAssessment}
                  className="bg-white/10 rounded-xl p-4"
                >
                  <Text className="text-white text-center font-medium">
                    Start New Assessment
                  </Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={handleStartAssessment}
                className="bg-purple-500 rounded-xl p-4"
              >
                <Text className="text-white text-center font-semibold text-lg">
                  Begin Assessment
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};