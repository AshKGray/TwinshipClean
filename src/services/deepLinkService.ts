import * as Linking from 'expo-linking';
import { useAuthStore } from '../state/authStore';

export interface DeepLinkHandler {
  path: string;
  handler: (params: Record<string, string>) => void | Promise<void>;
}

class DeepLinkService {
  private handlers: DeepLinkHandler[] = [];
  private isInitialized = false;

  constructor() {
    this.registerDefaultHandlers();
  }

  private registerDefaultHandlers() {
    // Email verification handler
    this.registerHandler('/auth/verify-email', async (params) => {
      const { token } = params;
      if (token) {
        try {
          const authStore = useAuthStore.getState();
          await authStore.verifyEmail(token);
          
          // Show success notification or navigate to success screen
          console.log('Email verified successfully via deep link');
        } catch (error) {
          console.error('Email verification failed:', error);
        }
      }
    });

    // Password reset handler
    this.registerHandler('/auth/reset-password', (params) => {
      const { token } = params;
      if (token) {
        // Navigate to reset password screen with token
        // This would typically use navigation service
        console.log('Password reset token received:', token);
      }
    });

    // Twin invitation handler
    this.registerHandler('/invite', (params) => {
      const { code, token } = params;
      if (code || token) {
        // Navigate to pairing screen with invitation data
        console.log('Twin invitation received:', { code, token });
      }
    });
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Handle initial URL if app was opened via deep link
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        this.handleUrl(initialUrl);
      }

      // Listen for incoming deep links while app is running
      const subscription = Linking.addEventListener('url', (event) => {
        this.handleUrl(event.url);
      });

      this.isInitialized = true;
      
      return () => {
        subscription?.remove();
      };
    } catch (error) {
      console.error('Failed to initialize deep link service:', error);
    }
  }

  registerHandler(path: string, handler: (params: Record<string, string>) => void | Promise<void>) {
    // Remove existing handler for the same path
    this.handlers = this.handlers.filter(h => h.path !== path);
    
    // Add new handler
    this.handlers.push({ path, handler });
  }

  private handleUrl(url: string) {
    try {
      const parsed = Linking.parse(url);
      const { hostname, path, queryParams } = parsed;

      console.log('Deep link received:', { hostname, path, queryParams });

      // Find matching handler
      const handler = this.handlers.find(h => h.path === path);
      
      if (handler) {
        handler.handler(queryParams || {});
      } else {
        console.warn('No handler found for deep link path:', path);
        
        // Handle common fallbacks
        this.handleFallback(path, queryParams || {});
      }
    } catch (error) {
      console.error('Failed to parse deep link:', error);
    }
  }

  private handleFallback(path: string, params: Record<string, string>) {
    // Handle fallback cases for unregistered paths
    if (path?.includes('verify') && params.token) {
      // Fallback email verification
      this.handleEmailVerification(params.token);
    } else if (path?.includes('reset') && params.token) {
      // Fallback password reset
      this.handlePasswordReset(params.token);
    } else if (path?.includes('invite') && (params.code || params.token)) {
      // Fallback invitation
      this.handleInvitation(params);
    }
  }

  private async handleEmailVerification(token: string) {
    try {
      const authStore = useAuthStore.getState();
      await authStore.verifyEmail(token);
      console.log('Email verified successfully');
    } catch (error) {
      console.error('Email verification failed:', error);
    }
  }

  private handlePasswordReset(token: string) {
    // Store token for password reset screen
    // This could be handled via navigation or state management
    console.log('Password reset token stored:', token);
  }

  private handleInvitation(params: Record<string, string>) {
    // Handle twin invitation
    console.log('Twin invitation processed:', params);
  }

  // Utility methods for creating deep links
  createEmailVerificationLink(token: string): string {
    const baseUrl = this.getBaseUrl();
    return `${baseUrl}/auth/verify-email?token=${token}`;
  }

  createPasswordResetLink(token: string): string {
    const baseUrl = this.getBaseUrl();
    return `${baseUrl}/auth/reset-password?token=${token}`;
  }

  createTwinInvitationLink(code: string): string {
    const baseUrl = this.getBaseUrl();
    return `${baseUrl}/invite?code=${code}`;
  }

  private getBaseUrl(): string {
    // In production, this would be your app's custom URL scheme
    // e.g., 'twinship://app' or 'https://twinship.app'
    return Linking.createURL('');
  }

  // Method to open external URLs (email clients, browsers, etc.)
  async openExternalUrl(url: string): Promise<boolean> {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to open external URL:', error);
      return false;
    }
  }

  // Method to share deep links
  getShareableLink(path: string, params: Record<string, string> = {}): string {
    const baseUrl = this.getBaseUrl();
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    return `${baseUrl}${path}${queryString ? `?${queryString}` : ''}`;
  }
}

// Export singleton instance
export const deepLinkService = new DeepLinkService();

// React hook for components that need deep link functionality
export const useDeepLinks = () => {
  const registerHandler = (path: string, handler: (params: Record<string, string>) => void | Promise<void>) => {
    deepLinkService.registerHandler(path, handler);
  };

  const createEmailVerificationLink = (token: string) => {
    return deepLinkService.createEmailVerificationLink(token);
  };

  const createPasswordResetLink = (token: string) => {
    return deepLinkService.createPasswordResetLink(token);
  };

  const createTwinInvitationLink = (code: string) => {
    return deepLinkService.createTwinInvitationLink(code);
  };

  const openExternalUrl = (url: string) => {
    return deepLinkService.openExternalUrl(url);
  };

  const getShareableLink = (path: string, params: Record<string, string> = {}) => {
    return deepLinkService.getShareableLink(path, params);
  };

  return {
    registerHandler,
    createEmailVerificationLink,
    createPasswordResetLink,
    createTwinInvitationLink,
    openExternalUrl,
    getShareableLink,
  };
};