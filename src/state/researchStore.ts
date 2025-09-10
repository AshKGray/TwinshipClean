import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ResearchStudy, 
  ConsentRecord, 
  ResearchParticipation,
  ResearchInsight,
  ParticipantDashboard,
  WithdrawalRequest
} from '../types/research';
import { researchService } from '../services/researchService';

interface ResearchState {
  // Data
  availableStudies: ResearchStudy[];
  participation: ResearchParticipation | null;
  consentRecords: ConsentRecord[];
  insights: ResearchInsight[];
  dashboard: ParticipantDashboard | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  selectedStudy: ResearchStudy | null;
  consentInProgress: boolean;
  
  // Actions
  loadAvailableStudies: () => Promise<void>;
  loadParticipation: (userId: string) => Promise<void>;
  loadDashboard: (userId: string) => Promise<void>;
  loadInsights: (userId: string) => Promise<void>;
  
  selectStudy: (study: ResearchStudy | null) => void;
  
  recordConsent: (
    userId: string, 
    studyId: string, 
    consentItems: ConsentRecord['consentedTo'],
    ipAddress?: string
  ) => Promise<void>;
  
  joinStudy: (userId: string, studyId: string) => Promise<void>;
  
  withdrawFromStudy: (
    userId: string, 
    studyId: string, 
    reason: string, 
    dataDisposition: WithdrawalRequest['dataDisposition']
  ) => Promise<void>;
  
  contributeData: (userId: string, dataType: string, dataPoints: number) => Promise<void>;
  
  updatePreferences: (userId: string, preferences: ResearchParticipation['preferences']) => Promise<void>;
  
  exportData: (userId: string) => Promise<object>;
  deleteAllData: (userId: string) => Promise<void>;
  
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useResearchStore = create<ResearchState>()(
  persist(
    (set, get) => ({
      // Initial state
      availableStudies: [],
      participation: null,
      consentRecords: [],
      insights: [],
      dashboard: null,
      isLoading: false,
      error: null,
      selectedStudy: null,
      consentInProgress: false,
      
      // Actions
      loadAvailableStudies: async () => {
        set({ isLoading: true, error: null });
        try {
          const studies = await researchService.getAvailableStudies();
          set({ availableStudies: studies, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load studies',
            isLoading: false 
          });
        }
      },
      
      loadParticipation: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const [participation, consent] = await Promise.all([
            researchService.getParticipation(userId),
            researchService.getConsentRecords(userId)
          ]);
          set({ 
            participation, 
            consentRecords: consent,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load participation',
            isLoading: false 
          });
        }
      },
      
      loadDashboard: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const dashboard = await researchService.getParticipantDashboard(userId);
          set({ dashboard, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load dashboard',
            isLoading: false 
          });
        }
      },
      
      loadInsights: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const insights = await researchService.getResearchInsights(userId);
          set({ insights, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load insights',
            isLoading: false 
          });
        }
      },
      
      selectStudy: (study: ResearchStudy | null) => {
        set({ selectedStudy: study });
      },
      
      recordConsent: async (
        userId: string, 
        studyId: string, 
        consentItems: ConsentRecord['consentedTo'],
        ipAddress?: string
      ) => {
        set({ consentInProgress: true, error: null });
        try {
          const consentRecord = await researchService.recordConsent(
            userId, 
            studyId, 
            consentItems, 
            ipAddress
          );
          
          const currentConsent = get().consentRecords;
          set({ 
            consentRecords: [...currentConsent, consentRecord],
            consentInProgress: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to record consent',
            consentInProgress: false 
          });
        }
      },
      
      joinStudy: async (userId: string, studyId: string) => {
        set({ isLoading: true, error: null });
        try {
          await researchService.joinStudy(userId, studyId);
          
          // Reload participation to get updated state
          const participation = await researchService.getParticipation(userId);
          set({ participation, isLoading: false });
          
          // Reload dashboard as well
          const dashboard = await researchService.getParticipantDashboard(userId);
          set({ dashboard });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to join study',
            isLoading: false 
          });
        }
      },
      
      withdrawFromStudy: async (
        userId: string, 
        studyId: string, 
        reason: string, 
        dataDisposition: WithdrawalRequest['dataDisposition']
      ) => {
        set({ isLoading: true, error: null });
        try {
          await researchService.withdrawFromStudy(userId, studyId, reason, dataDisposition);
          
          // Reload participation
          const participation = await researchService.getParticipation(userId);
          set({ participation, isLoading: false });
          
          // Reload dashboard
          const dashboard = await researchService.getParticipantDashboard(userId);
          set({ dashboard });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to withdraw from study',
            isLoading: false 
          });
        }
      },
      
      contributeData: async (userId: string, dataType: string, dataPoints: number) => {
        try {
          if (dataType === 'behavioral') {
            await researchService.contributeBehavioralData(userId, dataType, dataPoints);
          }
          
          // Reload participation to update contributions
          const participation = await researchService.getParticipation(userId);
          set({ participation });
          
          // Update dashboard
          const dashboard = await researchService.getParticipantDashboard(userId);
          set({ dashboard });
        } catch (error) {
          console.error('Failed to contribute data:', error);
        }
      },
      
      updatePreferences: async (userId: string, preferences: ResearchParticipation['preferences']) => {
        set({ isLoading: true, error: null });
        try {
          const participation = get().participation;
          if (participation) {
            const updated = { ...participation, preferences };
            await researchService.updateParticipation(userId, updated);
            set({ participation: updated, isLoading: false });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update preferences',
            isLoading: false 
          });
        }
      },
      
      exportData: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await researchService.exportUserData(userId);
          set({ isLoading: false });
          return data;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to export data',
            isLoading: false 
          });
          throw error;
        }
      },
      
      deleteAllData: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          await researchService.deleteAllUserData(userId);
          set({ 
            participation: null,
            consentRecords: [],
            insights: [],
            dashboard: null,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete data',
            isLoading: false 
          });
        }
      },
      
      setError: (error: string | null) => {
        set({ error });
      },
      
      clearError: () => {
        set({ error: null });
      },
      
      reset: () => {
        set({
          availableStudies: [],
          participation: null,
          consentRecords: [],
          insights: [],
          dashboard: null,
          isLoading: false,
          error: null,
          selectedStudy: null,
          consentInProgress: false
        });
      }
    }),
    {
      name: 'research-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist non-sensitive data
        availableStudies: state.availableStudies,
        selectedStudy: state.selectedStudy
      })
    }
  )
);