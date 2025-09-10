import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import invitationService, { Invitation, InvitationAnalytics } from '../services/invitationService';
import { TwinProfile } from './twinStore';

interface InvitationState {
  // Current invitation being processed
  currentInvitation: Invitation | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Invitation process state
  invitationStep: 'contact' | 'method' | 'sending' | 'sent' | 'success' | 'error';
  selectedMethod: 'email' | 'sms' | 'both' | null;
  recipientContact: {
    email?: string;
    phone?: string;
    name?: string;
  };
  
  // Analytics and history
  analytics: InvitationAnalytics | null;
  recentInvitations: Invitation[];
  
  // Deep link handling
  pendingInvitationToken: string | null;
  deepLinkData: {
    token?: string;
    processed?: boolean;
    timestamp?: number;
  } | null;
  
  // Actions
  setCurrentInvitation: (invitation: Invitation | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInvitationStep: (step: InvitationState['invitationStep']) => void;
  setSelectedMethod: (method: InvitationState['selectedMethod']) => void;
  setRecipientContact: (contact: InvitationState['recipientContact']) => void;
  
  // Invitation flow actions
  createAndSendInvitation: (
    inviterProfile: TwinProfile,
    recipientContact: { email?: string; phone?: string; name?: string },
    method: 'email' | 'sms' | 'both'
  ) => Promise<boolean>;
  
  processIncomingInvitation: (token: string) => Promise<{
    success: boolean;
    invitation?: Invitation;
    error?: string;
  }>;
  
  acceptInvitation: (token: string) => Promise<boolean>;
  declineInvitation: (token: string) => Promise<boolean>;
  
  // Analytics and management
  refreshAnalytics: () => Promise<void>;
  retryFailedInvitation: (invitationId: string, method: 'email' | 'sms') => Promise<boolean>;
  
  // Deep link management
  setPendingInvitationToken: (token: string | null) => void;
  setDeepLinkData: (data: InvitationState['deepLinkData']) => void;
  clearDeepLinkData: () => void;
  
  // Reset and cleanup
  reset: () => void;
  clearError: () => void;
}

export const useInvitationStore = create<InvitationState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentInvitation: null,
      isLoading: false,
      error: null,
      invitationStep: 'contact',
      selectedMethod: null,
      recipientContact: {},
      analytics: null,
      recentInvitations: [],
      pendingInvitationToken: null,
      deepLinkData: null,
      
      // Basic setters
      setCurrentInvitation: (invitation) => set({ currentInvitation: invitation }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),
      
      setInvitationStep: (step) => set({ invitationStep: step }),
      
      setSelectedMethod: (method) => set({ selectedMethod: method }),
      
      setRecipientContact: (contact) => {
        const currentContact = get().recipientContact;
        set({ recipientContact: { ...currentContact, ...contact } });
      },
      
      setPendingInvitationToken: (token) => set({ pendingInvitationToken: token }),
      
      setDeepLinkData: (data) => set({ deepLinkData: data }),
      
      clearDeepLinkData: () => set({ deepLinkData: null }),
      
      // Main invitation creation and sending flow
      createAndSendInvitation: async (inviterProfile, recipientContact, method) => {
        const { setLoading, setError, setInvitationStep, setCurrentInvitation } = get();
        
        try {
          setLoading(true);
          setError(null);
          setInvitationStep('sending');
          
          // Create invitation
          const invitation = await invitationService.createInvitation(
            inviterProfile,
            { email: recipientContact.email, phone: recipientContact.phone }
          );
          
          setCurrentInvitation(invitation);
          
          let emailSuccess = false;
          let smsSuccess = false;
          let hasErrors = false;
          const errors: string[] = [];
          
          // Send via email if requested
          if ((method === 'email' || method === 'both') && invitation.recipientEmail) {
            try {
              emailSuccess = await invitationService.sendEmailInvitation(invitation);
              if (!emailSuccess) {
                errors.push('Email invitation could not be sent');
              }
            } catch (error) {
              errors.push(`Email error: ${error instanceof Error ? error.message : 'Unknown error'}`);
              hasErrors = true;
            }
          }
          
          // Send via SMS if requested
          if ((method === 'sms' || method === 'both') && invitation.recipientPhone) {
            try {
              smsSuccess = await invitationService.sendSMSInvitation(invitation);
              if (!smsSuccess) {
                errors.push('SMS invitation could not be sent');
              }
            } catch (error) {
              errors.push(`SMS error: ${error instanceof Error ? error.message : 'Unknown error'}`);
              hasErrors = true;
            }
          }
          
          // Determine final result
          const success = emailSuccess || smsSuccess;
          
          if (success) {
            setInvitationStep('sent');
            if (errors.length > 0) {
              setError(`Partially sent: ${errors.join(', ')}`);
            }
            
            // Auto-transition to success after a delay
            setTimeout(() => {
              const currentState = get();
              if (currentState.invitationStep === 'sent') {
                currentState.setInvitationStep('success');
              }
            }, 2000);
            
            return true;
          } else {
            setInvitationStep('error');
            setError(errors.join(', ') || 'Failed to send invitation');
            return false;
          }
          
        } catch (error) {
          setInvitationStep('error');
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          setError(errorMessage);
          return false;
        } finally {
          setLoading(false);
        }
      },
      
      // Process incoming invitation (from deep link or manual entry)
      processIncomingInvitation: async (token) => {
        const { setLoading, setError, setCurrentInvitation } = get();
        
        try {
          setLoading(true);
          setError(null);
          
          const result = await invitationService.acceptInvitation(token);
          
          if (result.success && result.invitation) {
            setCurrentInvitation(result.invitation);
            return { success: true, invitation: result.invitation };
          } else {
            setError(result.error || 'Failed to process invitation');
            return { success: false, error: result.error };
          }
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        } finally {
          setLoading(false);
        }
      },
      
      // Accept invitation
      acceptInvitation: async (token) => {
        const { setLoading, setError } = get();
        
        try {
          setLoading(true);
          setError(null);
          
          const result = await invitationService.acceptInvitation(token);
          
          if (result.success) {
            // Refresh analytics to reflect the acceptance
            get().refreshAnalytics();
            return true;
          } else {
            setError(result.error || 'Failed to accept invitation');
            return false;
          }
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to accept invitation';
          setError(errorMessage);
          return false;
        } finally {
          setLoading(false);
        }
      },
      
      // Decline invitation
      declineInvitation: async (token) => {
        const { setLoading, setError } = get();
        
        try {
          setLoading(true);
          setError(null);
          
          const success = await invitationService.declineInvitation(token);
          
          if (success) {
            // Refresh analytics to reflect the decline
            get().refreshAnalytics();
            return true;
          } else {
            setError('Failed to decline invitation');
            return false;
          }
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to decline invitation';
          setError(errorMessage);
          return false;
        } finally {
          setLoading(false);
        }
      },
      
      // Refresh analytics data
      refreshAnalytics: async () => {
        try {
          const analytics = await invitationService.getInvitationAnalytics();
          set({ 
            analytics,
            recentInvitations: analytics.recentInvitations 
          });
        } catch (error) {
          console.error('Failed to refresh invitation analytics:', error);
        }
      },
      
      // Retry failed invitation
      retryFailedInvitation: async (invitationId, method) => {
        const { setLoading, setError } = get();
        
        try {
          setLoading(true);
          setError(null);
          
          const success = await invitationService.retryInvitation(invitationId, method);
          
          if (success) {
            // Refresh analytics and current invitation if it matches
            await get().refreshAnalytics();
            return true;
          } else {
            setError('Failed to retry invitation');
            return false;
          }
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to retry invitation';
          setError(errorMessage);
          return false;
        } finally {
          setLoading(false);
        }
      },
      
      // Reset state
      reset: () => set({
        currentInvitation: null,
        isLoading: false,
        error: null,
        invitationStep: 'contact',
        selectedMethod: null,
        recipientContact: {},
        pendingInvitationToken: null,
        deepLinkData: null,
      }),
      
    }),
    {
      name: 'invitation-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist essential data
      partialize: (state) => ({
        analytics: state.analytics,
        recentInvitations: state.recentInvitations,
        pendingInvitationToken: state.pendingInvitationToken,
        deepLinkData: state.deepLinkData,
      }),
    }
  )
);

// Selector hooks for better performance
export const useInvitationLoading = () => useInvitationStore(state => state.isLoading);
export const useInvitationError = () => useInvitationStore(state => state.error);
export const useInvitationStep = () => useInvitationStore(state => state.invitationStep);
export const useCurrentInvitation = () => useInvitationStore(state => state.currentInvitation);
export const useInvitationAnalytics = () => useInvitationStore(state => state.analytics);
export const usePendingInvitationToken = () => useInvitationStore(state => state.pendingInvitationToken);
export const useDeepLinkData = () => useInvitationStore(state => state.deepLinkData);

// Initialize invitation service on store creation
invitationService.initialize();
