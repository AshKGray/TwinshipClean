/**
 * Pair Store - Twin pair management and analytics
 * Handles secure twin pairing, data sharing, and relationship insights
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TwinPairData,
  PairAnalytics,
  AssessmentResults,
  PrivacyConsent,
  PairMatchingCriteria,
} from '../types/assessment/types';
import { SyncService } from '../services/syncService';
import { storageService } from '../services/storageService';
import { EncryptionService } from '../services/encryptionService';

export interface PairInvitation {
  id: string;
  fromUserId: string;
  toEmail?: string;
  toPhone?: string;
  shareCode: string;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
}

export interface PairConnection {
  pairId: string;
  connectedAt: string;
  lastInteraction: string;
  connectionStrength: number; // 0-1 based on interaction frequency
  sharedActivities: string[];
  mutualConsent: boolean;
}

interface PairState {
  // Pairing Management
  currentPair: TwinPairData | null;
  pairHistory: TwinPairData[];
  pendingInvitations: PairInvitation[];
  sentInvitations: PairInvitation[];
  
  // Analytics and Insights
  pairAnalytics: PairAnalytics | null;
  analyticsHistory: Record<string, PairAnalytics>;
  insightNotifications: Array<{
    id: string;
    type: 'similarity' | 'growth' | 'strength' | 'recommendation';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
  }>;
  
  // Connection Status
  connection: PairConnection | null;
  connectionHistory: PairConnection[];
  isOnline: boolean;
  lastSeen: string;
  
  // Privacy and Consent
  sharingConsent: PrivacyConsent | null;
  dataVisibility: {
    assessmentResults: boolean;
    personalInsights: boolean;
    recommendations: boolean;
    analytics: boolean;
  };
  
  // Actions - Pairing
  createInvitation: (email?: string, phone?: string, message?: string) => Promise<PairInvitation>;
  sendInvitation: (invitation: PairInvitation) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<TwinPairData>;
  declineInvitation: (invitationId: string) => Promise<void>;
  unpairTwin: () => Promise<void>;
  
  // Actions - Analytics
  generateAnalytics: (twin1Results: AssessmentResults, twin2Results: AssessmentResults) => Promise<PairAnalytics>;
  updateAnalytics: () => Promise<void>;
  getInsights: () => Promise<string[]>;
  dismissInsightNotification: (notificationId: string) => void;
  
  // Actions - Connection
  updateConnection: (activity: string) => void;
  setOnlineStatus: (online: boolean) => void;
  recordInteraction: (type: string, metadata?: any) => void;
  
  // Actions - Privacy
  updateSharingConsent: (consent: Partial<PrivacyConsent>) => Promise<void>;
  updateDataVisibility: (visibility: Partial<PairState['dataVisibility']>) => void;
  exportPairData: () => Promise<string>;
  deletePairData: () => Promise<void>;
}

export const usePairStore = create<PairState>()(persist(
    (set, get) => ({
      // Initial State
      currentPair: null,
      pairHistory: [],
      pendingInvitations: [],
      sentInvitations: [],
      pairAnalytics: null,
      analyticsHistory: {},
      insightNotifications: [],
      connection: null,
      connectionHistory: [],
      isOnline: false,
      lastSeen: new Date().toISOString(),
      sharingConsent: null,
      dataVisibility: {
        assessmentResults: false,
        personalInsights: false,
        recommendations: false,
        analytics: false,
      },

      // Pairing Actions
      createInvitation: async (email, phone, message) => {
        const shareCode = await generateShareCode();
        const invitation: PairInvitation = {
          id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          fromUserId: 'current_user_id', // Would get from auth context
          toEmail: email,
          toPhone: phone,
          shareCode,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          status: 'pending',
          message,
        };
        
        set(state => ({
          sentInvitations: [...state.sentInvitations, invitation],
        }));
        
        // Store securely
        await storageService.setSecure(`invitation_${invitation.id}`, invitation);
        
        return invitation;
      },

      sendInvitation: async (invitation) => {
        // In a real implementation, this would send via email/SMS service
        console.log('Sending invitation:', invitation);
        
        // Upload invitation to cloud for the recipient to find
        try {
          await SyncService.syncAssessmentResults(invitation as any, {
            cloudProvider: 'supabase',
            encryptCloud: true,
          });
        } catch (error) {
          console.error('Failed to upload invitation:', error);
          throw error;
        }
      },

      acceptInvitation: async (invitationId) => {
        const invitation = get().pendingInvitations.find(inv => inv.id === invitationId);
        if (!invitation) throw new Error('Invitation not found');
        
        // Create twin pair
        const pairData: TwinPairData = {
          pairId: `pair_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          twin1Id: invitation.fromUserId,
          twin2Id: 'current_user_id', // Would get from auth context
          pairedAt: new Date().toISOString(),
          bothConsented: false, // Will be updated when both consent
          sharedAssessments: [],
          privacyLevel: 'twin_only',
        };
        
        // Update invitation status
        set(state => ({
          pendingInvitations: state.pendingInvitations.map(inv =>
            inv.id === invitationId ? { ...inv, status: 'accepted' } : inv
          ),
          currentPair: pairData,
          pairHistory: [...state.pairHistory, pairData],
        }));
        
        // Store pair data securely
        await storageService.setSecure(`pair_${pairData.pairId}`, pairData);
        
        // Initialize connection
        const connection: PairConnection = {
          pairId: pairData.pairId,
          connectedAt: new Date().toISOString(),
          lastInteraction: new Date().toISOString(),
          connectionStrength: 0.1, // Starting value
          sharedActivities: [],
          mutualConsent: false,
        };
        
        set({ connection });
        
        return pairData;
      },

      declineInvitation: async (invitationId) => {
        set(state => ({
          pendingInvitations: state.pendingInvitations.map(inv =>
            inv.id === invitationId ? { ...inv, status: 'declined' } : inv
          ),
        }));
        
        // Remove from secure storage
        await storageService.removeSecure(`invitation_${invitationId}`);
      },

      unpairTwin: async () => {
        const state = get();
        if (!state.currentPair) return;
        
        // Move to history
        set({
          currentPair: null,
          connection: null,
          pairAnalytics: null,
        });
        
        // Clean up secure storage
        await storageService.removeSecure(`pair_${state.currentPair.pairId}`);
        if (state.pairAnalytics) {
          await storageService.removeSecure(`pair_analytics_${state.currentPair.pairId}`);
        }
      },

      // Analytics Actions
      generateAnalytics: async (twin1Results, twin2Results) => {
        const state = get();
        if (!state.currentPair) throw new Error('No active pair');
        
        // Verify consent from both twins
        if (!twin1Results.privacyConsent.twinDataMerging || 
            !twin2Results.privacyConsent.twinDataMerging) {
          throw new Error('Both twins must consent to data merging');
        }
        
        const analytics = await SyncService.mergePairData(
          state.currentPair.pairId,
          twin1Results,
          twin2Results
        );
        
        set({
          pairAnalytics: analytics,
          analyticsHistory: {
            ...state.analyticsHistory,
            [Date.now().toString()]: analytics,
          },
        });
        
        // Generate insight notifications
        const insights = generateInsightNotifications(analytics);
        set(state => ({
          insightNotifications: [...state.insightNotifications, ...insights],
        }));
        
        return analytics;
      },

      updateAnalytics: async () => {
        const state = get();
        if (!state.currentPair || !state.pairAnalytics) return;
        
        // Retrieve latest assessment results and regenerate analytics
        // This would typically fetch from the assessment store
        console.log('Updating pair analytics...');
      },

      getInsights: async () => {
        const state = get();
        if (!state.pairAnalytics) return [];
        
        const insights = [];
        
        // Generate contextual insights based on analytics
        Object.entries(state.pairAnalytics.similarityScores).forEach(([category, score]) => {
          if (score > 0.8) {
            insights.push(`You and your twin are highly similar in ${category}`);
          } else if (score < 0.3) {
            insights.push(`You and your twin have complementary ${category} traits`);
          }
        });
        
        return insights;
      },

      dismissInsightNotification: (notificationId) => {
        set(state => ({
          insightNotifications: state.insightNotifications.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          ),
        }));
      },

      // Connection Actions
      updateConnection: (activity) => {
        const state = get();
        if (!state.connection) return;
        
        const updatedConnection = {
          ...state.connection,
          lastInteraction: new Date().toISOString(),
          connectionStrength: Math.min(1, state.connection.connectionStrength + 0.1),
          sharedActivities: [...new Set([...state.connection.sharedActivities, activity])],
        };
        
        set({
          connection: updatedConnection,
          connectionHistory: [...state.connectionHistory, updatedConnection],
        });
      },

      setOnlineStatus: (online) => {
        set({
          isOnline: online,
          lastSeen: new Date().toISOString(),
        });
      },

      recordInteraction: (type, metadata) => {
        const state = get();
        if (!state.connection) return;
        
        // Record interaction for analytics
        console.log('Recording interaction:', { type, metadata, timestamp: new Date().toISOString() });
        
        // Update connection strength based on interaction type
        let strengthIncrease = 0.01; // Base increase
        
        switch (type) {
          case 'assessment_shared':
            strengthIncrease = 0.1;
            break;
          case 'message_sent':
            strengthIncrease = 0.02;
            break;
          case 'game_played':
            strengthIncrease = 0.05;
            break;
          case 'story_shared':
            strengthIncrease = 0.08;
            break;
        }
        
        get().updateConnection(type);
      },

      // Privacy Actions
      updateSharingConsent: async (consent) => {
        const state = get();
        const updatedConsent = {
          ...state.sharingConsent,
          ...consent,
          consentDate: new Date().toISOString(),
        };
        
        set({ sharingConsent: updatedConsent });
        
        // Store securely
        await storageService.setSecure('pair_sharing_consent', updatedConsent);
        
        // Update pair consent status
        if (state.currentPair && consent.twinDataMerging !== undefined) {
          const updatedPair = {
            ...state.currentPair,
            bothConsented: consent.twinDataMerging, // Simplified - would check both twins
          };
          
          set({ currentPair: updatedPair });
          await storageService.setSecure(`pair_${updatedPair.pairId}`, updatedPair);
        }
      },

      updateDataVisibility: (visibility) => {
        set(state => ({
          dataVisibility: {
            ...state.dataVisibility,
            ...visibility,
          },
        }));
      },

      exportPairData: async () => {
        const state = get();
        
        const exportData = {
          currentPair: state.currentPair,
          pairHistory: state.pairHistory,
          analytics: state.pairAnalytics,
          analyticsHistory: state.analyticsHistory,
          connection: state.connection,
          connectionHistory: state.connectionHistory,
          sharingConsent: state.sharingConsent,
          exportedAt: new Date().toISOString(),
        };
        
        return JSON.stringify(exportData, null, 2);
      },

      deletePairData: async () => {
        const state = get();
        
        // Delete from secure storage
        if (state.currentPair) {
          await storageService.removeSecure(`pair_${state.currentPair.pairId}`);
        }
        
        if (state.pairAnalytics) {
          await storageService.removeSecure(`pair_analytics_${state.currentPair?.pairId}`);
        }
        
        await storageService.removeSecure('pair_sharing_consent');
        
        // Clear state
        set({
          currentPair: null,
          pairHistory: [],
          pairAnalytics: null,
          analyticsHistory: {},
          connection: null,
          connectionHistory: [],
          sharingConsent: null,
          insightNotifications: [],
        });
      },
    }),
    {
      name: 'pair-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist non-sensitive data in AsyncStorage
        dataVisibility: state.dataVisibility,
        isOnline: state.isOnline,
        lastSeen: state.lastSeen,
        insightNotifications: state.insightNotifications.filter(n => !n.read),
      }),
    }
  )
);

// Utility Functions
async function generateShareCode(): Promise<string> {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `${timestamp}-${random}`;
}

function generateInsightNotifications(analytics: PairAnalytics): Array<{
  id: string;
  type: 'similarity' | 'growth' | 'strength' | 'recommendation';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}> {
  const notifications = [];
  const timestamp = new Date().toISOString();
  
  // Similarity insights
  Object.entries(analytics.similarityScores).forEach(([category, score]) => {
    if (score > 0.9) {
      notifications.push({
        id: `similarity_${category}_${Date.now()}`,
        type: 'similarity' as const,
        title: 'Amazing Similarity!',
        message: `You and your twin are incredibly similar in ${category} (${Math.round(score * 100)}% match)`,
        timestamp,
        read: false,
      });
    }
  });
  
  // Growth opportunities
  analytics.growthOpportunities.forEach((opportunity, index) => {
    notifications.push({
      id: `growth_${index}_${Date.now()}`,
      type: 'growth' as const,
      title: 'Growth Opportunity',
      message: opportunity,
      timestamp,
      read: false,
    });
  });
  
  // Strengths
  analytics.strengthAreas.forEach((strength, index) => {
    notifications.push({
      id: `strength_${index}_${Date.now()}`,
      type: 'strength' as const,
      title: 'Shared Strength',
      message: strength,
      timestamp,
      read: false,
    });
  });
  
  return notifications;
}