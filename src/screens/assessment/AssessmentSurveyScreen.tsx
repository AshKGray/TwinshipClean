import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTwinStore } from '../../state/twinStore';
import { useAssessmentStore } from '../../state/assessmentStore';
import { LikertScale } from '../../types/assessment';

const likertOptions = [
  { value: 1, label: 'Strongly\nDisagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Slightly\nDisagree' },
  { value: 4, label: 'Neutral' },
  { value: 5, label: 'Slightly\nAgree' },
  { value: 6, label: 'Agree' },
  { value: 7, label: 'Strongly\nAgree' }
];

export const AssessmentSurveyScreen = () => {
  const navigation = useNavigation<any>();
  const { userProfile } = useTwinStore();
  const {
    currentSession,
    currentQuestionIndex,
    saveResponse,
    navigateToQuestion,
    getCurrentQuestion,
    getProgress,
    canSubmit,
    submitAssessment,
    isLoading
  } = useAssessmentStore();

  const [selectedValue, setSelectedValue] = useState<LikertScale | null>(null);
  
  const themeColor = userProfile?.accentColor || 'neon-purple';
  const currentQuestion = getCurrentQuestion();
  const progress = getProgress();
  const totalQuestions = 210; // From item bank

  // Check if current question already has a response
  React.useEffect(() => {
    if (currentQuestion && currentSession) {
      const existingResponse = currentSession.responses.find(
        r => r.itemId === currentQuestion.id
      );
      setSelectedValue(existingResponse?.value || null);
    }
  }, [currentQuestion, currentSession]);

  const handleResponse = (value: LikertScale) => {
    setSelectedValue(value);
  };

  const handleNext = () => {
    if (selectedValue && currentQuestion) {
      saveResponse(currentQuestion.id, selectedValue);
      setSelectedValue(null);
      
      // Check if this was the last question
      if (currentQuestionIndex === totalQuestions - 1) {
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      navigateToQuestion(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (canSubmit()) {
      const results = await submitAssessment();
      if (results) {
        navigation.navigate('AssessmentResults', { sessionId: results.sessionId });
      }
    } else {
      // Show warning about minimum completion
      alert('Please complete at least 70% of the assessment for valid results.');
    }
  };

  const handleExit = () => {
    // Auto-save is handled by Zustand persist
    navigation.goBack();
  };

  if (!currentQuestion) {
    return (
      <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 items-center justify-center">
          <Text className="text-white text-lg">Loading question...</Text>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require("../../assets/galaxybackground.png")} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        {/* Header with Progress */}
        <View className="px-6 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable onPress={handleExit}>
              <Ionicons name="close" size={24} color="white" />
            </Pressable>
            <Text className="text-white font-medium">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </Text>
            <Pressable 
              onPress={handleSubmit}
              disabled={!canSubmit()}
              className={`${canSubmit() ? 'opacity-100' : 'opacity-50'}`}
            >
              <Text className="text-white font-medium">
                {progress >= 100 ? 'Finish' : `${Math.round(progress)}%`}
              </Text>
            </Pressable>
          </View>

          {/* Progress Bar */}
          <View className="h-2 bg-white/20 rounded-full overflow-hidden">
            <View 
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        <ScrollView className="flex-1 px-6">
          {/* Category Badge */}
          <View className="mt-6 mb-4">
            <View className="bg-white/10 rounded-full px-4 py-2 self-start">
              <Text className="text-white/70 text-sm capitalize">
                {currentQuestion.category.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>

          {/* Question */}
          <View className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
            <Text className="text-white text-xl font-medium leading-relaxed">
              {currentQuestion.question}
            </Text>
            {currentQuestion.reverseScored && (
              <View className="mt-3 flex-row items-center">
                <Ionicons name="information-circle" size={16} color="rgba(147, 197, 253, 0.8)" />
                <Text className="text-blue-300/80 text-xs ml-1">
                  This question measures the opposite trait
                </Text>
              </View>
            )}
          </View>

          {/* Likert Scale */}
          <View className="mb-8">
            <Text className="text-white/70 text-sm text-center mb-4">
              Select your level of agreement
            </Text>
            
            <View className="flex-row justify-between mb-2">
              {likertOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => handleResponse(option.value as LikertScale)}
                  className="flex-1 items-center"
                >
                  <View 
                    className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
                      selectedValue === option.value 
                        ? 'bg-purple-500' 
                        : 'bg-white/10'
                    }`}
                  >
                    <Text className={`text-lg font-bold ${
                      selectedValue === option.value ? 'text-white' : 'text-white/60'
                    }`}>
                      {option.value}
                    </Text>
                  </View>
                  <Text className={`text-xs text-center ${
                    selectedValue === option.value ? 'text-white' : 'text-white/60'
                  }`}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Scale Labels */}
            <View className="flex-row justify-between mt-4 px-2">
              <Text className="text-red-400 text-xs">Strongly Disagree</Text>
              <Text className="text-green-400 text-xs">Strongly Agree</Text>
            </View>
          </View>

          {/* Navigation Buttons */}
          <View className="flex-row space-x-3 mb-8">
            <Pressable
              onPress={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`flex-1 bg-white/10 rounded-xl p-4 ${
                currentQuestionIndex === 0 ? 'opacity-50' : 'opacity-100'
              }`}
            >
              <Text className="text-white text-center font-medium">Previous</Text>
            </Pressable>

            <Pressable
              onPress={handleNext}
              disabled={!selectedValue}
              className={`flex-1 rounded-xl p-4 ${
                selectedValue ? 'bg-purple-500' : 'bg-white/10 opacity-50'
              }`}
            >
              <Text className="text-white text-center font-medium">
                {currentQuestionIndex === totalQuestions - 1 ? 'Submit' : 'Next'}
              </Text>
            </Pressable>
          </View>

          {/* Save Notice */}
          <View className="bg-blue-500/10 rounded-xl p-3 mb-4">
            <View className="flex-row items-center">
              <Ionicons name="save-outline" size={16} color="rgba(147, 197, 253, 0.8)" />
              <Text className="text-blue-300/80 text-xs ml-2">
                Your progress is automatically saved
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};