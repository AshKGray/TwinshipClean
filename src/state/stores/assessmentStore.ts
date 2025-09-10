/**
 * Assessment Store - Local-first assessment data management with Zustand
 * Handles assessment progress, responses, and results with encryption support
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MMKV } from 'react-native-mmkv';
import {
  AssessmentTemplate,
  AssessmentProgress,
  AssessmentResponse,
  AssessmentResults,
  AssessmentScore,
  PrivacyConsent,
  SyncStatus,
  AssessmentCategory
} from '../types/assessment/types';
import { EncryptionService } from '../services/encryptionService';
import { StorageService } from '../services/storageService';

// Secure MMKV storage for sensitive assessment data
const secureStorage = new MMKV({
  id: 'assessment-secure',
  encryptionKey: 'assessment-encryption-key', // In production, derive from device keychain
});

interface AssessmentState {
  // Templates and Configuration
  templates: Record<string, AssessmentTemplate>;
  activeTemplateId: string | null;
  
  // Progress Tracking
  currentProgress: AssessmentProgress | null;
  progressHistory: Record<string, AssessmentProgress>;
  
  // Results and Scores
  results: Record<string, AssessmentResults>;
  cachedScores: Record<string, AssessmentScore[]>;
  
  // Privacy and Consent
  privacyConsent: PrivacyConsent | null;
  dataCollectionEnabled: boolean;
  
  // Sync and Storage
  syncStatus: SyncStatus;
  offlineMode: boolean;
  encryptionEnabled: boolean;
  
  // UI State
  currentQuestionIndex: number;
  showProgressSave: boolean;
  assessmentStartTime: number;
  
  // Actions - Template Management
  loadTemplate: (template: AssessmentTemplate) => void;
  setActiveTemplate: (templateId: string) => void;
  
  // Actions - Progress Management
  startAssessment: (templateId: string, userId: string) => void;
  saveResponse: (questionId: string, response: AssessmentResponse) => Promise<void>;
  saveProgress: () => Promise<void>;
  resumeAssessment: (progressId: string) => void;
  completeAssessment: () => Promise<AssessmentResults>;
  
  // Actions - Results Management
  calculateScores: (responses: Record<string, AssessmentResponse>) => AssessmentScore[];
  saveResults: (results: AssessmentResults) => Promise<void>;
  getResults: (resultId: string) => AssessmentResults | null;
  
  // Actions - Privacy Management
  updatePrivacyConsent: (consent: PrivacyConsent) => void;
  setDataCollection: (enabled: boolean) => void;
  exportData: () => Promise<string>;
  deleteAllData: () => Promise<void>;
  
  // Actions - Sync Management
  setSyncStatus: (status: Partial<SyncStatus>) => void;
  setOfflineMode: (offline: boolean) => void;
  getPendingSyncData: () => any[];
  
  // Actions - Navigation
  setCurrentQuestion: (index: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (questionId: string) => void;
}

export const useAssessmentStore = create<AssessmentState>()(persist(
    (set, get) => ({
      // Initial State
      templates: {},
      activeTemplateId: null,
      currentProgress: null,
      progressHistory: {},
      results: {},
      cachedScores: {},
      privacyConsent: null,
      dataCollectionEnabled: false,
      syncStatus: {
        pendingChanges: 0,
        needsResolution: false,
      },
      offlineMode: false,
      encryptionEnabled: true,
      currentQuestionIndex: 0,
      showProgressSave: false,
      assessmentStartTime: 0,

      // Template Management
      loadTemplate: (template) => {
        set((state) => ({
          templates: {
            ...state.templates,
            [template.id]: template,
          },
        }));
      },

      setActiveTemplate: (templateId) => {
        set({ activeTemplateId: templateId });
      },

      // Progress Management
      startAssessment: (templateId, userId) => {
        const template = get().templates[templateId];
        if (!template) throw new Error('Template not found');

        const newProgress: AssessmentProgress = {
          templateId,
          userId,
          startedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          currentSectionId: template.sections[0]?.id,
          currentQuestionIndex: 0,
          totalQuestions: template.totalQuestions,
          completedQuestions: 0,
          percentComplete: 0,
          timeSpent: 0,
          responses: {},
          sectionProgress: {},
        };

        set({
          currentProgress: newProgress,
          activeTemplateId: templateId,
          currentQuestionIndex: 0,
          assessmentStartTime: Date.now(),
        });
      },

      saveResponse: async (questionId, response) => {
        const state = get();
        if (!state.currentProgress) return;

        const updatedResponse = {
          ...response,
          timestamp: new Date().toISOString(),
        };

        const updatedProgress = {
          ...state.currentProgress,
          responses: {
            ...state.currentProgress.responses,
            [questionId]: updatedResponse,
          },
          lastUpdated: new Date().toISOString(),
          completedQuestions: Object.keys(state.currentProgress.responses).length + 1,
          percentComplete: ((Object.keys(state.currentProgress.responses).length + 1) / state.currentProgress.totalQuestions) * 100,
        };

        set({ currentProgress: updatedProgress });

        // Auto-save progress every few responses
        if (updatedProgress.completedQuestions % 5 === 0) {
          await get().saveProgress();
        }
      },

      saveProgress: async () => {
        const state = get();
        if (!state.currentProgress) return;

        const progressId = `progress_${state.currentProgress.templateId}_${state.currentProgress.userId}`;
        
        if (state.encryptionEnabled) {
          const encrypted = await EncryptionService.encrypt(JSON.stringify(state.currentProgress));
          await StorageService.setSecure(progressId, encrypted);
        } else {
          await StorageService.set(progressId, JSON.stringify(state.currentProgress));
        }

        set({
          progressHistory: {
            ...state.progressHistory,
            [progressId]: state.currentProgress,
          },
          syncStatus: {
            ...state.syncStatus,
            pendingChanges: state.syncStatus.pendingChanges + 1,
          },
        });
      },

      resumeAssessment: (progressId) => {
        const progress = get().progressHistory[progressId];
        if (progress) {
          set({
            currentProgress: progress,
            activeTemplateId: progress.templateId,
            currentQuestionIndex: progress.currentQuestionIndex,
          });
        }
      },

      completeAssessment: async () => {
        const state = get();
        if (!state.currentProgress) throw new Error('No assessment in progress');

        const scores = state.calculateScores(state.currentProgress.responses);
        
        const results: AssessmentResults = {
          id: `results_${state.currentProgress.templateId}_${Date.now()}`,
          templateId: state.currentProgress.templateId,
          userId: state.currentProgress.userId,
          completedAt: new Date().toISOString(),
          totalTimeSpent: Date.now() - state.assessmentStartTime,
          scores,
          overallScore: scores.reduce((sum, score) => sum + score.normalizedScore, 0) / scores.length,
          reliability: calculateReliability(state.currentProgress.responses),
          validity: calculateValidity(state.currentProgress.responses),
          insights: generateInsights(scores),
          recommendations: generateRecommendations(scores),
          privacyConsent: state.privacyConsent || getDefaultPrivacyConsent(),
          encrypted: state.encryptionEnabled,
          synced: false,
        };

        await get().saveResults(results);
        
        set({
          currentProgress: null,
          currentQuestionIndex: 0,
          assessmentStartTime: 0,
        });

        return results;
      },

      // Score Calculation
      calculateScores: (responses) => {
        const template = get().templates[get().activeTemplateId!];
        if (!template) return [];

        const scoresByCategory: Record<AssessmentCategory, number[]> = {
          personality: [],
          cognitive: [],
          behavioral: [],
          emotional: [],
          social: [],
          preferences: [],
          experiences: [],
          relationships: [],
        };

        // Group responses by category and calculate raw scores
        template.sections.forEach(section => {
          section.questions.forEach(question => {
            const response = responses[question.id];
            if (response && typeof response.value === 'number') {
              scoresByCategory[question.category].push(response.value);
            }
          });
        });

        // Convert to normalized scores
        const scores: AssessmentScore[] = Object.entries(scoresByCategory)
          .filter(([_, values]) => values.length > 0)
          .map(([category, values]) => {
            const rawScore = values.reduce((sum, val) => sum + val, 0) / values.length;
            return {
              category: category as AssessmentCategory,
              rawScore,
              normalizedScore: (rawScore / 5) * 100, // Assuming 1-5 scale
              confidence: calculateScoreConfidence(values),
            };
          });

        return scores;
      },

      saveResults: async (results) => {
        const state = get();
        
        if (state.encryptionEnabled) {
          const encrypted = await EncryptionService.encrypt(JSON.stringify(results));
          await StorageService.setSecure(`results_${results.id}`, encrypted);
        }

        set({
          results: {
            ...state.results,
            [results.id]: results,
          },
          cachedScores: {
            ...state.cachedScores,
            [results.id]: results.scores,
          },
          syncStatus: {
            ...state.syncStatus,
            pendingChanges: state.syncStatus.pendingChanges + 1,
          },
        });
      },

      getResults: (resultId) => {
        return get().results[resultId] || null;
      },

      // Privacy Management
      updatePrivacyConsent: (consent) => {
        set({ privacyConsent: consent });
      },

      setDataCollection: (enabled) => {
        set({ dataCollectionEnabled: enabled });
      },

      exportData: async () => {
        const state = get();
        const exportData = {
          results: state.results,
          progressHistory: state.progressHistory,
          privacyConsent: state.privacyConsent,
          exportedAt: new Date().toISOString(),
        };
        return JSON.stringify(exportData, null, 2);
      },

      deleteAllData: async () => {
        // Clear secure storage
        Object.keys(get().results).forEach(async (resultId) => {
          await StorageService.removeSecure(`results_${resultId}`);
        });

        Object.keys(get().progressHistory).forEach(async (progressId) => {
          await StorageService.removeSecure(progressId);
        });

        set({
          currentProgress: null,
          progressHistory: {},
          results: {},
          cachedScores: {},
          privacyConsent: null,
          dataCollectionEnabled: false,
        });
      },

      // Sync Management
      setSyncStatus: (status) => {
        set({
          syncStatus: {
            ...get().syncStatus,
            ...status,
          },
        });
      },

      setOfflineMode: (offline) => {
        set({ offlineMode: offline });
      },

      getPendingSyncData: () => {
        const state = get();
        const pending = [];
        
        // Add unsynced results
        Object.values(state.results)
          .filter(result => !result.synced)
          .forEach(result => pending.push({ type: 'result', data: result }));

        return pending;
      },

      // Navigation
      setCurrentQuestion: (index) => {
        set({ currentQuestionIndex: index });
      },

      nextQuestion: () => {
        const state = get();
        const template = state.templates[state.activeTemplateId!];
        if (template && state.currentQuestionIndex < template.totalQuestions - 1) {
          set({ currentQuestionIndex: state.currentQuestionIndex + 1 });
        }
      },

      previousQuestion: () => {
        const state = get();
        if (state.currentQuestionIndex > 0) {
          set({ currentQuestionIndex: state.currentQuestionIndex - 1 });
        }
      },

      goToQuestion: (questionId) => {
        const state = get();
        const template = state.templates[state.activeTemplateId!];
        if (!template) return;

        let questionIndex = 0;
        let found = false;
        
        for (const section of template.sections) {
          for (const question of section.questions) {
            if (question.id === questionId) {
              found = true;
              break;
            }
            questionIndex++;
          }
          if (found) break;
        }

        if (found) {
          set({ currentQuestionIndex: questionIndex });
        }
      },
    }),
    {
      name: 'assessment-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        templates: state.templates,
        progressHistory: state.progressHistory,
        results: {}, // Don't persist sensitive results in AsyncStorage
        privacyConsent: state.privacyConsent,
        dataCollectionEnabled: state.dataCollectionEnabled,
        encryptionEnabled: state.encryptionEnabled,
        offlineMode: state.offlineMode,
      }),
    }
  )
);

// Utility Functions
function calculateReliability(responses: Record<string, AssessmentResponse>): number {
  // Calculate consistency based on response patterns and revisit counts
  const revisitCounts = Object.values(responses).map(r => r.revisitCount || 0);
  const avgRevisits = revisitCounts.reduce((sum, count) => sum + count, 0) / revisitCounts.length;
  return Math.max(0, 1 - (avgRevisits / 10)); // Lower revisit count = higher reliability
}

function calculateValidity(responses: Record<string, AssessmentResponse>): number {
  // Calculate validity based on response times and confidence levels
  const validResponses = Object.values(responses).filter(r => 
    r.timeSpent && r.timeSpent > 1000 && r.confidence && r.confidence > 2
  );
  return validResponses.length / Object.keys(responses).length;
}

function calculateScoreConfidence(values: number[]): number {
  if (values.length < 2) return 0.5;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower standard deviation = higher confidence
  return Math.max(0.1, Math.min(1, 1 - (stdDev / mean)));
}

function generateInsights(scores: AssessmentScore[]): string[] {
  const insights = [];
  const highScores = scores.filter(s => s.normalizedScore > 75);
  const lowScores = scores.filter(s => s.normalizedScore < 25);
  
  highScores.forEach(score => {
    insights.push(`Strong ${score.category} traits detected`);
  });
  
  lowScores.forEach(score => {
    insights.push(`Opportunity for growth in ${score.category}`);
  });
  
  return insights;
}

function generateRecommendations(scores: AssessmentScore[]): string[] {
  const recommendations = [];
  
  scores.forEach(score => {
    if (score.normalizedScore < 50) {
      recommendations.push(`Consider activities to develop ${score.category} skills`);
    } else if (score.normalizedScore > 80) {
      recommendations.push(`Leverage your strong ${score.category} abilities`);
    }
  });
  
  return recommendations;
}

function getDefaultPrivacyConsent(): PrivacyConsent {
  return {
    dataCollection: false,
    researchParticipation: false,
    anonymizedSharing: false,
    twinDataMerging: false,
    dataRetention: 'until_deleted',
    consentDate: new Date().toISOString(),
    consentVersion: '1.0',
  };
}