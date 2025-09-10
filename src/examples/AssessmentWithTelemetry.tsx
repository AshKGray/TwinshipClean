/**
 * Assessment with Telemetry Integration Example
 * Demonstrates how to integrate telemetry collection in assessment flow
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useTelemetryIntegration } from '../hooks/useTelemetryIntegration';
import { useTelemetryStore, selectTelemetryStatus } from '../state/telemetryStore';
import PrivacyConsentModal from '../components/common/PrivacyConsentModal';
import TelemetryDashboard from '../components/admin/TelemetryDashboard';
import { AssessmentCategory, LikertScale } from '../types/assessment';

interface AssessmentQuestion {
  id: string;
  category: AssessmentCategory;
  text: string;
  sectionId: string;
}

// Sample assessment questions
const SAMPLE_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'if_01',
    category: 'identity_fusion',
    text: 'I often feel like my twin and I are the same person.',
    sectionId: 'identity_section',
  },
  {
    id: 'if_02', 
    category: 'identity_fusion',
    text: 'I have difficulty making decisions without my twin\'s input.',
    sectionId: 'identity_section',
  },
  {
    id: 'au_01',
    category: 'autonomy',
    text: 'I feel comfortable pursuing interests that my twin doesn\'t share.',
    sectionId: 'autonomy_section',
  },
  {
    id: 'au_02',
    category: 'autonomy', 
    text: 'I can express disagreement with my twin without feeling guilty.',
    sectionId: 'autonomy_section',
  },
  {
    id: 'bd_01',
    category: 'boundaries',
    text: 'I respect my twin\'s need for private space and time.',
    sectionId: 'boundaries_section',
  },
];

const LIKERT_OPTIONS = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Somewhat Disagree' },
  { value: 4, label: 'Neither Agree nor Disagree' },
  { value: 5, label: 'Somewhat Agree' },
  { value: 6, label: 'Agree' },
  { value: 7, label: 'Strongly Agree' },
];

interface AssessmentWithTelemetryProps {
  userId: string;
  onComplete?: (responses: Record<string, LikertScale>) => void;
  showAdminDashboard?: boolean;
}

const AssessmentWithTelemetry: React.FC<AssessmentWithTelemetryProps> = ({
  userId,
  onComplete,
  showAdminDashboard = false,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, LikertScale>>({});
  const [revisionCounts, setRevisionCounts] = useState<Record<string, number>>({});
  const [confidenceLevels, setConfidenceLevels] = useState<Record<string, number>>({});
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  const { userConsent, config } = useTelemetryStore();
  const telemetryStatus = selectTelemetryStatus();

  // Initialize telemetry integration
  const {
    trackAssessmentStart,
    trackQuestionView,
    trackQuestionResponse,
    trackQuestionRevision,
    trackSectionCompletion,
    trackAssessmentCompletion,
    isEnabled,
    resetSession,
  } = useTelemetryIntegration({
    sessionId: `assessment_${userId}_${Date.now()}`,
    userId,
    assessmentVersion: '1.0.0',
    totalQuestions: SAMPLE_QUESTIONS.length,
  });

  const currentQuestion = SAMPLE_QUESTIONS[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === SAMPLE_QUESTIONS.length - 1;
  const currentResponse = responses[currentQuestion?.id];

  // Check if consent is needed on mount
  useEffect(() => {
    if (config.consentRequired && !userConsent) {
      setShowConsentModal(true);
    }
  }, [config.consentRequired, userConsent]);

  // Handle assessment start
  const handleStartAssessment = useCallback(async () => {
    setIsStarted(true);
    setStartTime(Date.now());
    
    // Track assessment start
    if (isEnabled()) {
      await trackAssessmentStart();
    }
    
    // Track first question view
    if (SAMPLE_QUESTIONS.length > 0) {
      await handleQuestionView(0);
    }
  }, [trackAssessmentStart, isEnabled]);

  // Handle question view tracking
  const handleQuestionView = useCallback(async (questionIndex: number) => {
    const question = SAMPLE_QUESTIONS[questionIndex];
    if (!question || !isEnabled()) return;

    await trackQuestionView({
      questionId: question.id,
      questionCategory: question.category,
      questionIndex,
      sectionId: question.sectionId,
    });
  }, [trackQuestionView, isEnabled]);

  // Handle response change
  const handleResponseChange = useCallback(async (value: LikertScale, confidence?: number) => {
    if (!currentQuestion) return;

    const previousResponse = responses[currentQuestion.id];
    const isRevision = previousResponse !== undefined;
    const currentRevisions = revisionCounts[currentQuestion.id] || 0;

    // Update local state
    setResponses(prev => ({ ...prev, [currentQuestion.id]: value }));
    
    if (confidence) {
      setConfidenceLevels(prev => ({ ...prev, [currentQuestion.id]: confidence }));
    }

    if (isRevision) {
      setRevisionCounts(prev => ({
        ...prev,
        [currentQuestion.id]: currentRevisions + 1,
      }));
    }

    // Track telemetry
    if (isEnabled()) {
      if (isRevision) {
        await trackQuestionRevision(
          {
            questionId: currentQuestion.id,
            questionCategory: currentQuestion.category,
            questionIndex: currentQuestionIndex,
            sectionId: currentQuestion.sectionId,
          },
          value,
          currentRevisions + 1
        );
      } else {
        await trackQuestionResponse(
          {
            questionId: currentQuestion.id,
            questionCategory: currentQuestion.category,
            questionIndex: currentQuestionIndex,
            sectionId: currentQuestion.sectionId,
          },
          value,
          currentRevisions,
          confidence
        );
      }
    }
  }, [currentQuestion, currentQuestionIndex, responses, revisionCounts, 
      trackQuestionResponse, trackQuestionRevision, isEnabled]);

  // Handle navigation
  const handleNext = useCallback(async () => {
    if (!currentResponse) {
      Alert.alert('Required', 'Please select a response before continuing.');
      return;
    }

    if (isLastQuestion) {
      await handleCompleteAssessment();
    } else {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      await handleQuestionView(nextIndex);

      // Track section completion if moving to new section
      const currentSection = currentQuestion.sectionId;
      const nextQuestion = SAMPLE_QUESTIONS[nextIndex];
      
      if (nextQuestion.sectionId !== currentSection) {
        await trackSectionCompletion(
          currentSection,
          currentQuestion.category,
          SAMPLE_QUESTIONS.filter(q => q.sectionId === currentSection).length,
          1.0, // 100% completion
          confidenceLevels[currentQuestion.id]
        );
      }
    }
  }, [currentResponse, isLastQuestion, currentQuestionIndex, currentQuestion,
      handleCompleteAssessment, trackSectionCompletion, confidenceLevels]);

  const handlePrevious = useCallback(async () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      await handleQuestionView(prevIndex);
    }
  }, [currentQuestionIndex, handleQuestionView]);

  // Handle assessment completion
  const handleCompleteAssessment = useCallback(async () => {
    const completedQuestions = Object.keys(responses).length;
    const totalTime = Date.now() - startTime;
    const totalRevisions = Object.values(revisionCounts).reduce((sum, count) => sum + count, 0);

    // Track final section completion
    const lastSection = currentQuestion.sectionId;
    await trackSectionCompletion(
      lastSection,
      currentQuestion.category,
      SAMPLE_QUESTIONS.filter(q => q.sectionId === lastSection).length,
      1.0,
      confidenceLevels[currentQuestion.id]
    );

    // Track assessment completion
    if (isEnabled()) {
      await trackAssessmentCompletion(completedQuestions);
    }

    setIsCompleted(true);
    
    if (onComplete) {
      onComplete(responses);
    }
  }, [responses, startTime, revisionCounts, currentQuestion, trackSectionCompletion,
      trackAssessmentCompletion, confidenceLevels, onComplete, isEnabled]);

  // Handle privacy consent
  const handleConsentChange = useCallback(async (consent: boolean, newConfig?: any) => {
    const store = useTelemetryStore.getState();
    
    if (newConfig) {
      store.updateConfig(newConfig);
    }
    
    await store.updateConsent(consent);
    
    // Reset session when consent changes
    resetSession();
  }, [resetSession]);

  // Render consent modal
  if (showConsentModal) {
    return (
      <PrivacyConsentModal
        visible={true}
        onClose={() => setShowConsentModal(false)}
        onConsentChange={handleConsentChange}
        initialConsent={userConsent}
        isUpdate={false}
      />
    );
  }

  // Render admin dashboard
  if (showDashboard && showAdminDashboard) {
    return (
      <TelemetryDashboard
        isAdmin={true}
        onPrivacySettings={() => setShowConsentModal(true)}
        onExportData={() => {
          const exportData = useTelemetryStore.getState().exportData();
          Alert.alert('Export Complete', 'Telemetry data has been exported.');
          console.log('Exported data:', exportData);
        }}
      />
    );
  }

  // Render completion screen
  if (isCompleted) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <View className="flex-1 justify-center items-center px-4">
          <View className="bg-white rounded-xl p-8 items-center shadow-lg max-w-sm w-full">
            <Text className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Assessment Complete!
            </Text>
            
            <Text className="text-gray-600 text-center mb-6">
              Thank you for completing the twin relationship assessment. Your responses
              help us improve our understanding of twin dynamics.
            </Text>

            {isEnabled() && (
              <Text className="text-sm text-blue-600 text-center mb-4">
                Your anonymous data contributes to assessment research while maintaining
                complete privacy.
              </Text>
            )}

            <View className="w-full space-y-3">
              <TouchableOpacity
                className="bg-blue-600 py-3 px-6 rounded-lg"
                onPress={() => {
                  // Reset for new assessment
                  setCurrentQuestionIndex(0);
                  setResponses({});
                  setRevisionCounts({});
                  setConfidenceLevels({});
                  setIsStarted(false);
                  setIsCompleted(false);
                  resetSession();
                }}
              >
                <Text className="text-white font-medium text-center">Take Another Assessment</Text>
              </TouchableOpacity>

              {showAdminDashboard && (
                <TouchableOpacity
                  className="border border-gray-300 py-3 px-6 rounded-lg"
                  onPress={() => setShowDashboard(true)}
                >
                  <Text className="text-gray-700 font-medium text-center">View Analytics</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Render start screen
  if (!isStarted) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <View className="flex-1 justify-center items-center px-4">
          <View className="bg-white rounded-xl p-8 items-center shadow-lg max-w-sm w-full">
            <Text className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Twin Relationship Assessment
            </Text>
            
            <Text className="text-gray-600 text-center mb-6">
              This assessment explores various aspects of twin relationships including
              identity, autonomy, boundaries, and communication patterns.
            </Text>

            <Text className="text-sm text-gray-500 text-center mb-6">
              Estimated time: 5-10 minutes
            </Text>

            {/* Telemetry status indicator */}
            <View className="w-full mb-6">
              <View className={`p-3 rounded-lg border ${
                telemetryStatus === 'enabled' ? 'bg-green-50 border-green-200' :
                telemetryStatus === 'consent_required' ? 'bg-yellow-50 border-yellow-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <Text className={`text-xs text-center ${
                  telemetryStatus === 'enabled' ? 'text-green-700' :
                  telemetryStatus === 'consent_required' ? 'text-yellow-700' :
                  'text-gray-600'
                }`}>
                  Analytics: {telemetryStatus === 'enabled' ? 'Contributing to research' :
                            telemetryStatus === 'consent_required' ? 'Consent required' :
                            'Disabled'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              className="w-full bg-blue-600 py-3 px-6 rounded-lg mb-3"
              onPress={handleStartAssessment}
            >
              <Text className="text-white font-medium text-center">Start Assessment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full border border-gray-300 py-3 px-6 rounded-lg"
              onPress={() => setShowConsentModal(true)}
            >
              <Text className="text-gray-700 font-medium text-center">Privacy Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Render assessment question
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-gray-900">
              Question {currentQuestionIndex + 1} of {SAMPLE_QUESTIONS.length}
            </Text>
            
            {isEnabled() && (
              <View className="bg-green-100 px-2 py-1 rounded">
                <Text className="text-green-700 text-xs font-medium">Research Mode</Text>
              </View>
            )}
          </View>
          
          {/* Progress bar */}
          <View className="mt-2 bg-gray-200 rounded-full h-2">
            <View 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${((currentQuestionIndex + 1) / SAMPLE_QUESTIONS.length) * 100}%` 
              }}
            />
          </View>
        </View>

        {/* Question content */}
        <ScrollView className="flex-1 px-4 py-6">
          <Text className="text-xl font-semibold text-gray-900 mb-6 leading-relaxed">
            {currentQuestion.text}
          </Text>

          {/* Likert scale options */}
          <View className="space-y-3">
            {LIKERT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`p-4 rounded-lg border-2 ${
                  currentResponse === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
                onPress={() => handleResponseChange(option.value as LikertScale, 4)}
              >
                <View className="flex-row items-center">
                  <View className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    currentResponse === option.value
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`} />
                  
                  <Text className={`flex-1 ${
                    currentResponse === option.value
                      ? 'text-blue-700 font-medium'
                      : 'text-gray-700'
                  }`}>
                    {option.label}
                  </Text>
                  
                  <Text className={`text-sm ${
                    currentResponse === option.value
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }`}>
                    {option.value}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Revision indicator */}
          {revisionCounts[currentQuestion?.id] > 0 && (
            <View className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Text className="text-yellow-700 text-sm text-center">
                Response revised {revisionCounts[currentQuestion.id]} time(s)
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Navigation */}
        <View className="bg-white border-t border-gray-200 px-4 py-3">
          <View className="flex-row justify-between">
            <TouchableOpacity
              className={`flex-1 py-3 px-4 rounded-lg mr-2 ${
                currentQuestionIndex === 0
                  ? 'bg-gray-100'
                  : 'bg-gray-200'
              }`}
              onPress={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <Text className={`text-center font-medium ${
                currentQuestionIndex === 0
                  ? 'text-gray-400'
                  : 'text-gray-700'
              }`}>
                Previous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-3 px-4 rounded-lg ml-2 ${
                currentResponse
                  ? 'bg-blue-600'
                  : 'bg-gray-300'
              }`}
              onPress={handleNext}
              disabled={!currentResponse}
            >
              <Text className={`text-center font-medium ${
                currentResponse
                  ? 'text-white'
                  : 'text-gray-500'
              }`}>
                {isLastQuestion ? 'Complete' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AssessmentWithTelemetry;