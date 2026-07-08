import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AssessmentSession,
  AssessmentResponse,
  AssessmentResults,
  LikertScale,
  AssessmentItem
} from '../types/assessment';
import assessmentItemBank from '../data/assessmentItemBank.json';
import { generateAssessmentReport, handleMissingData } from '../utils/assessmentScoring';

interface AssessmentState {
  // Current session
  currentSession: AssessmentSession | null;
  
  // All sessions (for history)
  sessions: AssessmentSession[];
  
  // Assessment results
  results: AssessmentResults[];
  
  // Pair analytics (when both twins complete)
  pairResults: any | null;
  
  // UI state
  currentQuestionIndex: number;
  isLoading: boolean;
  error: string | null;
  
  // Premium state
  isPremium: boolean;
  hasSeenTeaser: boolean;
  
  // Actions
  startAssessment: (userId: string, twinId?: string) => void;
  saveResponse: (itemId: string, value: LikertScale) => void;
  navigateToQuestion: (index: number) => void;
  submitAssessment: () => Promise<AssessmentResults | null>;
  resumeAssessment: (sessionId: string) => void;
  clearCurrentSession: () => void;
  
  // Premium actions
  setPremiumStatus: (isPremium: boolean) => void;
  markTeaserSeen: () => void;
  
  // Getters
  getCurrentQuestion: () => AssessmentItem | null;
  getProgress: () => number;
  canSubmit: () => boolean;
  getSessionById: (sessionId: string) => AssessmentSession | undefined;
  getResultsById: (sessionId: string) => AssessmentResults | undefined;
  getAllResults: () => AssessmentResults[];
}

// Flatten all items from categories into a single array
const getAllItems = (): AssessmentItem[] => {
  const items: AssessmentItem[] = [];
  Object.values(assessmentItemBank.categories).forEach(category => {
    items.push(...category.items);
  });
  return items;
};

const allItems = getAllItems();
const TOTAL_QUESTIONS = allItems.length;
const MIN_COMPLETION_RATE = 0.7; // 70% minimum for valid results

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSession: null,
      sessions: [],
      results: [],
      pairResults: null,
      currentQuestionIndex: 0,
      isLoading: false,
      error: null,
      isPremium: false,
      hasSeenTeaser: false,

      // Start new assessment
      startAssessment: (userId: string, twinId?: string) => {
        const sessionId = `session_${Date.now()}_${userId}`;
        const newSession: AssessmentSession = {
          id: sessionId,
          userId,
          twinId,
          startDate: new Date().toISOString(),
          responses: [],
          currentProgress: 0,
          isComplete: false
        };

        set({
          currentSession: newSession,
          currentQuestionIndex: 0,
          error: null
        });

        // Also add to sessions array
        set(state => ({
          sessions: [...state.sessions, newSession]
        }));
      },

      // Save response and auto-advance
      saveResponse: (itemId: string, value: LikertScale) => {
        const { currentSession, currentQuestionIndex } = get();
        
        if (!currentSession) {
          set({ error: 'No active assessment session' });
          return;
        }

        // Create response
        const response: AssessmentResponse = {
          itemId,
          value,
          timestamp: new Date().toISOString()
        };

        // Update session with new response
        const updatedResponses = currentSession.responses.filter(r => r.itemId !== itemId);
        updatedResponses.push(response);
        
        const progress = (updatedResponses.length / TOTAL_QUESTIONS) * 100;
        
        const updatedSession: AssessmentSession = {
          ...currentSession,
          responses: updatedResponses,
          currentProgress: progress
        };

        // Update current session and sessions array
        set(state => ({
          currentSession: updatedSession,
          sessions: state.sessions.map(s => 
            s.id === updatedSession.id ? updatedSession : s
          ),
          currentQuestionIndex: Math.min(currentQuestionIndex + 1, TOTAL_QUESTIONS - 1),
          error: null
        }));

        // Auto-save to AsyncStorage happens via Zustand persist
      },

      // Navigate to specific question
      navigateToQuestion: (index: number) => {
        if (index >= 0 && index < TOTAL_QUESTIONS) {
          set({ currentQuestionIndex: index });
        }
      },

      // Submit assessment and calculate results
      submitAssessment: async () => {
        const { currentSession, isPremium } = get();
        
        if (!currentSession) {
          set({ error: 'No active assessment session' });
          return null;
        }

        set({ isLoading: true, error: null });

        try {
          // Validate completion rate
          const validation = handleMissingData(
            currentSession.responses,
            TOTAL_QUESTIONS
          );

          if (!validation.isValid) {
            set({ 
              error: validation.message,
              isLoading: false 
            });
            return null;
          }

          // Generate assessment report
          const results = generateAssessmentReport(
            currentSession.responses,
            currentSession.id,
            currentSession.userId,
            currentSession.twinId
          );

          // Mark session as complete
          const completedSession: AssessmentSession = {
            ...currentSession,
            completionDate: new Date().toISOString(),
            isComplete: true,
            currentProgress: 100
          };

          // Update state
          set(state => ({
            currentSession: null,
            sessions: state.sessions.map(s => 
              s.id === completedSession.id ? completedSession : s
            ),
            results: [...state.results, results],
            currentQuestionIndex: 0,
            isLoading: false,
            error: null
          }));

          // Return results for navigation
          return results;

        } catch (error) {
          set({ 
            error: 'Failed to calculate assessment results',
            isLoading: false 
          });
          return null;
        }
      },

      // Resume existing assessment
      resumeAssessment: (sessionId: string) => {
        const session = get().sessions.find(s => s.id === sessionId);
        
        if (!session || session.isComplete) {
          set({ error: 'Cannot resume this assessment' });
          return;
        }

        // Find the next unanswered question
        const answeredItemIds = session.responses.map(r => r.itemId);
        const nextQuestionIndex = allItems.findIndex(item => 
          !answeredItemIds.includes(item.id)
        );

        set({
          currentSession: session,
          currentQuestionIndex: nextQuestionIndex >= 0 ? nextQuestionIndex : 0,
          error: null
        });
      },

      // Clear current session
      clearCurrentSession: () => {
        set({
          currentSession: null,
          currentQuestionIndex: 0,
          error: null
        });
      },

      // Premium status
      setPremiumStatus: (isPremium: boolean) => {
        set({ isPremium });
      },

      markTeaserSeen: () => {
        set({ hasSeenTeaser: true });
      },

      // Getters
      getCurrentQuestion: () => {
        const { currentQuestionIndex } = get();
        return allItems[currentQuestionIndex] || null;
      },

      getProgress: () => {
        const { currentSession } = get();
        if (!currentSession) return 0;
        return currentSession.currentProgress;
      },

      canSubmit: () => {
        const { currentSession } = get();
        if (!currentSession) return false;
        
        const completionRate = (currentSession.responses.length / TOTAL_QUESTIONS) * 100;
        return completionRate >= (MIN_COMPLETION_RATE * 100);
      },

      getSessionById: (sessionId: string) => {
        return get().sessions.find(s => s.id === sessionId);
      },

      getResultsById: (sessionId: string) => {
        return get().results.find(r => r.sessionId === sessionId);
      },

      getAllResults: () => {
        return get().results;
      }
    }),
    {
      name: 'assessment-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        results: state.results,
        isPremium: state.isPremium,
        hasSeenTeaser: state.hasSeenTeaser
      })
    }
  )
);