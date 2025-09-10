import * as Linking from 'expo-linking';
import { useInvitationStore } from '../state/invitationStore';
import invitationService from '../services/invitationService';

// Deep link URL scheme configuration
const DEEP_LINK_SCHEME = 'twinshipvibe';
const WEB_URL = 'https://twinshipvibe.app'; // Future web app URL

// URL patterns
const URL_PATTERNS = {
  invitation: /\/invitation\/([A-F0-9]{64})/i,
  profile: /\/profile\/(.+)/,
  chat: /\/chat/,
  assessment: /\/assessment/,
} as const;

interface DeepLinkData {
  type: 'invitation' | 'profile' | 'chat' | 'assessment' | 'unknown';
  params?: Record<string, string>;
  token?: string;
  url: string;
  timestamp: number;
}

class DeepLinkManager {
  private static instance: DeepLinkManager;
  private isInitialized = false;
  private linkingListener: any = null;

  private constructor() {}

  static getInstance(): DeepLinkManager {
    if (!DeepLinkManager.instance) {
      DeepLinkManager.instance = new DeepLinkManager();
    }
    return DeepLinkManager.instance;
  }

  /**
   * Initialize deep linking with Expo Linking
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Handle initial URL if app was opened from a deep link
      const initialURL = await Linking.getInitialURL();
      if (initialURL) {
        await this.handleIncomingURL(initialURL);
      }

      // Listen for incoming URLs while app is running
      this.linkingListener = Linking.addEventListener('url', (event) => {
        this.handleIncomingURL(event.url);
      });

      this.isInitialized = true;
      console.log('Deep linking initialized successfully');
    } catch (error) {
      console.error('Failed to initialize deep linking:', error);
    }
  }

  /**
   * Clean up event listeners
   */
  cleanup(): void {
    if (this.linkingListener) {
      this.linkingListener.remove();
      this.linkingListener = null;
    }
    this.isInitialized = false;
  }

  /**
   * Parse incoming URL and extract relevant data
   */
  private parseURL(url: string): DeepLinkData {
    const timestamp = Date.now();
    
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname;

      // Check for invitation pattern
      const invitationMatch = pathname.match(URL_PATTERNS.invitation);
      if (invitationMatch) {
        return {
          type: 'invitation',
          token: invitationMatch[1],
          url,
          timestamp,
        };
      }

      // Check for profile pattern
      const profileMatch = pathname.match(URL_PATTERNS.profile);
      if (profileMatch) {
        return {
          type: 'profile',
          params: { userId: profileMatch[1] },
          url,
          timestamp,
        };
      }

      // Check for chat pattern
      if (URL_PATTERNS.chat.test(pathname)) {
        return {
          type: 'chat',
          url,
          timestamp,
        };
      }

      // Check for assessment pattern
      if (URL_PATTERNS.assessment.test(pathname)) {
        return {
          type: 'assessment',
          url,
          timestamp,
        };
      }

      // Unknown pattern
      return {
        type: 'unknown',
        url,
        timestamp,
      };
    } catch (error) {
      console.error('Failed to parse deep link URL:', error);
      return {
        type: 'unknown',
        url,
        timestamp,
      };
    }
  }

  /**
   * Handle incoming URL
   */
  private async handleIncomingURL(url: string): Promise<void> {
    try {
      console.log('Handling incoming URL:', url);
      
      const linkData = this.parseURL(url);
      
      switch (linkData.type) {
        case 'invitation':
          await this.handleInvitationLink(linkData);
          break;
          
        case 'profile':
          await this.handleProfileLink(linkData);
          break;
          
        case 'chat':
          await this.handleChatLink(linkData);
          break;
          
        case 'assessment':
          await this.handleAssessmentLink(linkData);
          break;
          
        default:
          console.warn('Unknown deep link type:', linkData.type);
          break;
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  }

  /**
   * Handle invitation deep link
   */
  private async handleInvitationLink(linkData: DeepLinkData): Promise<void> {
    if (!linkData.token) {
      console.error('No invitation token found in deep link');
      return;
    }

    const invitationStore = useInvitationStore.getState();
    
    try {
      // Set deep link data for UI handling
      invitationStore.setDeepLinkData({
        token: linkData.token,
        processed: false,
        timestamp: linkData.timestamp,
      });
      
      // Store the pending token
      invitationStore.setPendingInvitationToken(linkData.token);
      
      console.log('Invitation deep link processed, token stored:', linkData.token);
    } catch (error) {
      console.error('Failed to handle invitation deep link:', error);
    }
  }

  /**
   * Handle profile deep link
   */
  private async handleProfileLink(linkData: DeepLinkData): Promise<void> {
    console.log('Profile deep link - not implemented yet:', linkData.params);
    // TODO: Navigate to profile screen with user ID
  }

  /**
   * Handle chat deep link
   */
  private async handleChatLink(linkData: DeepLinkData): Promise<void> {
    console.log('Chat deep link - not implemented yet');
    // TODO: Navigate to chat screen
  }

  /**
   * Handle assessment deep link
   */
  private async handleAssessmentLink(linkData: DeepLinkData): Promise<void> {
    console.log('Assessment deep link - not implemented yet');
    // TODO: Navigate to assessment screen
  }

  /**
   * Create invitation deep link
   */
  createInvitationLink(token: string): string {
    return `${DEEP_LINK_SCHEME}://invitation/${token}`;
  }

  /**
   * Create web fallback URL for sharing
   */
  createWebInvitationLink(token: string): string {
    return `${WEB_URL}/invitation/${token}`;
  }

  /**
   * Create universal link (supports both app and web)
   */
  createUniversalInvitationLink(token: string): string {
    // In a real app, this would be a universal link that works on both web and mobile
    // For now, we'll use the deep link format
    return this.createInvitationLink(token);
  }

  /**
   * Check if a URL is a valid invitation link
   */
  isValidInvitationLink(url: string): boolean {
    try {
      const linkData = this.parseURL(url);
      return linkData.type === 'invitation' && !!linkData.token && linkData.token.length === 64;
    } catch {
      return false;
    }
  }

  /**
   * Extract invitation token from URL
   */
  extractInvitationToken(url: string): string | null {
    try {
      const linkData = this.parseURL(url);
      return linkData.type === 'invitation' ? linkData.token || null : null;
    } catch {
      return null;
    }
  }

  /**
   * Process pending invitation token
   */
  async processPendingInvitation(): Promise<{
    success: boolean;
    invitation?: any;
    error?: string;
  }> {
    const invitationStore = useInvitationStore.getState();
    const token = invitationStore.pendingInvitationToken;
    
    if (!token) {
      return { success: false, error: 'No pending invitation token' };
    }

    try {
      const result = await invitationStore.processIncomingInvitation(token);
      
      if (result.success) {
        // Mark as processed
        const deepLinkData = invitationStore.deepLinkData;
        if (deepLinkData) {
          invitationStore.setDeepLinkData({ ...deepLinkData, processed: true });
        }
        
        // Clear pending token
        invitationStore.setPendingInvitationToken(null);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process invitation';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Clear pending deep link data
   */
  clearPendingData(): void {
    const invitationStore = useInvitationStore.getState();
    invitationStore.setPendingInvitationToken(null);
    invitationStore.clearDeepLinkData();
  }

  /**
   * Get current deep link status
   */
  getDeepLinkStatus(): {
    hasPendingInvitation: boolean;
    token?: string;
    isProcessed?: boolean;
  } {
    const invitationStore = useInvitationStore.getState();
    const token = invitationStore.pendingInvitationToken;
    const deepLinkData = invitationStore.deepLinkData;
    
    return {
      hasPendingInvitation: !!token,
      token: token || undefined,
      isProcessed: deepLinkData?.processed,
    };
  }
}

// Export singleton instance
export const deepLinkManager = DeepLinkManager.getInstance();
export default deepLinkManager;

// Helper functions for React components
export const useDeepLinkHandler = () => {
  const initializeDeepLinking = () => deepLinkManager.initialize();
  const cleanupDeepLinking = () => deepLinkManager.cleanup();
  const processPendingInvitation = () => deepLinkManager.processPendingInvitation();
  const clearPendingData = () => deepLinkManager.clearPendingData();
  const getDeepLinkStatus = () => deepLinkManager.getDeepLinkStatus();
  
  return {
    initializeDeepLinking,
    cleanupDeepLinking,
    processPendingInvitation,
    clearPendingData,
    getDeepLinkStatus,
  };
};

// Utility functions
export const createInvitationLink = (token: string) => deepLinkManager.createInvitationLink(token);
export const createWebInvitationLink = (token: string) => deepLinkManager.createWebInvitationLink(token);
export const isValidInvitationLink = (url: string) => deepLinkManager.isValidInvitationLink(url);
export const extractInvitationToken = (url: string) => deepLinkManager.extractInvitationToken(url);
