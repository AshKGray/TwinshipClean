/**
 * Assessment Store
 * Manages assessment state, data integrity, and persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  AssessmentSession, 
  AssessmentResponse, 
  AssessmentResults,
  ValidationResult,
  LikertResponse
} from './types';
import { validateAssessmentResponses, calculateReliabilityMetrics } from './scoringAlgorithms';

interface AssessmentState {
  // Current session
  currentSession: AssessmentSession | null;
  
  // Historical data
  completedSessions: AssessmentSession[];
  assessmentResults: AssessmentResults[];
  
  // UI state
  isAssessmentActive: boolean;
  currentQuestionIndex: number;
  lastSaveTime: string | null;
  autoSaveEnabled: boolean;
  
  // Data integrity
  lastValidation: ValidationResult | null;
  backupData: string | null;
  
  // Actions
  startAssessment: (userId: string, version: string) => void;
  saveResponse: (questionId: string, response: LikertResponse, responseTime?: number) => void;
  updateProgress: (progress: number) => void;
  completeAssessment: () => Promise<void>;
  pauseAssessment: () => void;
  resumeAssessment: () => void;
  abandonAssessment: () => void;
  
  // Data management
  validateCurrentSession: () => ValidationResult;
  createBackup: () => void;
  restoreFromBackup: () => boolean;
  exportData: () => string;
  importData: (data: string) => boolean;
  clearAllData: () => void;
  
  // Auto-save
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  performAutoSave: () => void;
}

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSession: null,
      completedSessions: [],
      assessmentResults: [],
      isAssessmentActive: false,
      currentQuestionIndex: 0,
      lastSaveTime: null,
      autoSaveEnabled: true,
      lastValidation: null,
      backupData: null,

      // Assessment lifecycle
      startAssessment: (userId: string, version: string) => {
        const newSession: AssessmentSession = {
          id: `assessment_${Date.now()}_${userId}`,
          userId,
          startTime: new Date().toISOString(),
          responses: [],
          progress: 0,
          isComplete: false,
          version
        };

        set({
          currentSession: newSession,
          isAssessmentActive: true,
          currentQuestionIndex: 0,
          lastSaveTime: new Date().toISOString()
        });
        
        // Create initial backup
        get().createBackup();
      },

      saveResponse: (questionId: string, response: LikertResponse, responseTime?: number) => {
        const state = get();
        if (!state.currentSession || !state.isAssessmentActive) {
          throw new Error('No active assessment session');
        }

        const newResponse: AssessmentResponse = {
          questionId,
          response,
          timestamp: new Date().toISOString(),
          responseTime
        };

        // Remove any existing response for this question (allow updates)
        const updatedResponses = [
          ...state.currentSession.responses.filter(r => r.questionId !== questionId),
          newResponse
        ];

        const updatedSession = {
          ...state.currentSession,
          responses: updatedResponses
        };

        set({
          currentSession: updatedSession,
          lastSaveTime: new Date().toISOString()
        });

        // Auto-save if enabled
        if (state.autoSaveEnabled) {
          setTimeout(() => get().performAutoSave(), 100);
        }
      },

      updateProgress: (progress: number) => {
        const state = get();
        if (!state.currentSession) return;

        const updatedSession = {
          ...state.currentSession,
          progress: Math.max(0, Math.min(100, progress))
        };

        set({ 
          currentSession: updatedSession,
          currentQuestionIndex: Math.floor((progress / 100) * 50) // Assuming 50 questions
        });
      },

      completeAssessment: async () => {
        const state = get();
        if (!state.currentSession || !state.isAssessmentActive) {
          throw new Error('No active assessment session to complete');
        }

        // Validate session before completion
        const validation = get().validateCurrentSession();
        if (!validation.isValid) {
          throw new Error(`Cannot complete assessment: ${validation.errors.join(', ')}`);
        }

        const completedSession = {
          ...state.currentSession,
          endTime: new Date().toISOString(),
          progress: 100,
          isComplete: true
        };

        set({
          currentSession: null,
          isAssessmentActive: false,
          completedSessions: [...state.completedSessions, completedSession],
          currentQuestionIndex: 0,
          lastSaveTime: new Date().toISOString()
        });

        // Create backup after completion
        get().createBackup();
      },

      pauseAssessment: () => {
        set({ isAssessmentActive: false });
        get().performAutoSave();
      },

      resumeAssessment: () => {
        const state = get();
        if (state.currentSession && !state.currentSession.isComplete) {
          set({ isAssessmentActive: true });
        }
      },

      abandonAssessment: () => {
        const state = get();
        if (state.currentSession) {
          // Move to completed sessions as abandoned
          const abandonedSession = {
            ...state.currentSession,
            endTime: new Date().toISOString(),
            isComplete: false
          };
          
          set({
            currentSession: null,
            isAssessmentActive: false,
            completedSessions: [...state.completedSessions, abandonedSession],
            currentQuestionIndex: 0
          });
        }
      },

      // Data integrity and validation
      validateCurrentSession: () => {
        const state = get();
        if (!state.currentSession) {
          return {
            isValid: false,
            errors: ['No current session to validate'],
            warnings: [],
            missingResponses: []
          };
        }

        // Create a set of all required questions (this would come from your question bank)
        const requiredQuestions = new Set<string>();
        // TODO: Populate with actual required question IDs
        
        const validation = validateAssessmentResponses(
          state.currentSession.responses,
          requiredQuestions
        );

        set({ lastValidation: validation });
        return validation;
      },

      createBackup: () => {
        const state = get();
        const backupData = JSON.stringify({
          currentSession: state.currentSession,
          completedSessions: state.completedSessions,
          assessmentResults: state.assessmentResults,
          timestamp: new Date().toISOString()
        });

        set({ backupData });
      },

      restoreFromBackup: () => {
        const state = get();
        if (!state.backupData) return false;

        try {
          const backup = JSON.parse(state.backupData);
          set({
            currentSession: backup.currentSession,
            completedSessions: backup.completedSessions || [],
            assessmentResults: backup.assessmentResults || []
          });
          return true;
        } catch (error) {
          console.error('Failed to restore from backup:', error);
          return false;
        }
      },

      exportData: () => {
        const state = get();
        return JSON.stringify({
          completedSessions: state.completedSessions,
          assessmentResults: state.assessmentResults,
          exportedAt: new Date().toISOString(),
          version: '1.0.0'
        }, null, 2);
      },

      importData: (data: string) => {
        try {
          const imported = JSON.parse(data);
          
          // Validate imported data structure
          if (!imported.completedSessions || !Array.isArray(imported.completedSessions)) {
            throw new Error('Invalid data structure: missing completedSessions array');
          }

          set({
            completedSessions: [
              ...get().completedSessions,
              ...imported.completedSessions.filter((session: AssessmentSession) => 
                !get().completedSessions.some(existing => existing.id === session.id)
              )
            ],
            assessmentResults: [
              ...get().assessmentResults,
              ...(imported.assessmentResults || []).filter((result: AssessmentResults) => 
                !get().assessmentResults.some(existing => existing.sessionId === result.sessionId)
              )
            ]
          });

          return true;
        } catch (error) {
          console.error('Failed to import data:', error);
          return false;
        }
      },

      clearAllData: () => {
        set({
          currentSession: null,
          completedSessions: [],
          assessmentResults: [],
          isAssessmentActive: false,
          currentQuestionIndex: 0,
          lastSaveTime: null,
          lastValidation: null,
          backupData: null
        });
      },

      // Auto-save functionality
      enableAutoSave: () => set({ autoSaveEnabled: true }),
      
      disableAutoSave: () => set({ autoSaveEnabled: false }),

      performAutoSave: () => {
        const state = get();
        if (!state.autoSaveEnabled || !state.currentSession) return;

        // Create backup
        get().createBackup();
        
        // Update last save time
        set({ lastSaveTime: new Date().toISOString() });
      }
    }),
    {
      name: 'assessment-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        completedSessions: state.completedSessions,
        assessmentResults: state.assessmentResults,
        autoSaveEnabled: state.autoSaveEnabled,
        backupData: state.backupData
      }),
      onRehydrateStorage: () => (state) => {
        // Recovery logic after app restart
        if (state?.currentSession && state.isAssessmentActive) {
          // Check if session was interrupted
          const now = new Date();
          const lastSave = state.lastSaveTime ? new Date(state.lastSaveTime) : now;
          const timeDiff = now.getTime() - lastSave.getTime();
          
          // If more than 30 minutes since last save, consider session abandoned
          if (timeDiff > 30 * 60 * 1000) {
            state.abandonAssessment();
          }
        }
      }
    }
  )
);

// Recovery utilities
export const assessmentRecovery = {
  /**
   * Check for interrupted sessions and offer recovery
   */
  checkForInterruptedSession: (): AssessmentSession | null => {
    const state = useAssessmentStore.getState();
    if (state.currentSession && !state.currentSession.isComplete && !state.isAssessmentActive) {
      return state.currentSession;
    }
    return null;
  },

  /**
   * Calculate estimated completion time based on current progress
   */
  estimateTimeRemaining: (session: AssessmentSession, avgTimePerQuestion: number = 15): number => {
    const remaining = 100 - session.progress;
    const questionsRemaining = (remaining / 100) * 50; // Assuming 50 total questions
    return questionsRemaining * avgTimePerQuestion; // seconds
  }
};