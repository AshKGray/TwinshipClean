import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, User, AuthTokens, RegisterData, LoginData } from '../services/authService';

export interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Biometric state
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  biometricType: string[];
  
  // Actions
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loginWithBiometrics: () => Promise<void>;
  enableBiometricAuth: (email: string, password: string) => Promise<void>;
  disableBiometricAuth: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  
  // Utility actions
  clearError: () => void;
  initializeAuth: () => Promise<void>;
  checkBiometricAvailability: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      biometricEnabled: false,
      biometricAvailable: false,
      biometricType: [],

      // Actions
      login: async (data: LoginData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.login(data);
          
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Check if email verification is required but don't block login
          if (response.requiresEmailVerification) {
            set({ 
              error: 'Please check your email to verify your account. You can still use the app while unverified.' 
            });
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Login failed',
            isAuthenticated: false,
            user: null,
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authService.register(data);

          // Import and reset onboarding state for new users
          const { useTwinStore } = await import('./twinStore');
          const { setOnboarded } = useTwinStore.getState();
          setOnboarded(false);

          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          if (response.requiresEmailVerification) {
            set({
              error: 'Please check your email to verify your account. A verification email has been sent.'
            });
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Registration failed',
            isAuthenticated: false,
            user: null,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await authService.logout();
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            biometricEnabled: false,
          });
        } catch (error: any) {
          console.error('Logout error:', error);
          // Always clear local state even if API call fails
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            biometricEnabled: false,
          });
        }
      },

      loginWithBiometrics: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.loginWithBiometrics();
          
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Biometric login failed',
          });
          throw error;
        }
      },

      enableBiometricAuth: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const success = await authService.enableBiometricAuth(email, password);
          
          if (success) {
            set({
              biometricEnabled: true,
              isLoading: false,
            });
          } else {
            throw new Error('Failed to enable biometric authentication');
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to enable biometric authentication',
          });
          throw error;
        }
      },

      disableBiometricAuth: async () => {
        try {
          await authService.clearBiometricCredentials();
          set({ biometricEnabled: false });
        } catch (error: any) {
          console.error('Failed to disable biometric auth:', error);
          set({ error: 'Failed to disable biometric authentication' });
        }
      },

      verifyEmail: async (token: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.verifyEmail(token);
          
          // Update user with verified status
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: { ...currentUser, emailVerified: true },
              isLoading: false,
              error: null,
            });
          } else {
            set({
              isLoading: false,
              error: response.message,
            });
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Email verification failed',
          });
          throw error;
        }
      },

      resendVerificationEmail: async (email: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.resendVerificationEmail(email);
          
          set({
            isLoading: false,
            error: response.message, // This is actually a success message
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to resend verification email',
          });
          throw error;
        }
      },

      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.forgotPassword(email);
          
          set({
            isLoading: false,
            error: response.message, // This is actually a success message
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Password reset request failed',
          });
          throw error;
        }
      },

      resetPassword: async (token: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.resetPassword(token, password);
          
          set({
            isLoading: false,
            error: response.message, // This is actually a success message
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Password reset failed',
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      initializeAuth: async () => {
        set({ isLoading: true });
        
        try {
          // Check if user is authenticated and get current user
          const isAuthenticated = await authService.isAuthenticated();
          
          if (isAuthenticated) {
            const user = await authService.getCurrentUser();
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }

          // Check biometric availability and status
          await get().checkBiometricAvailability();
        } catch (error: any) {
          console.error('Auth initialization error:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null, // Don't show error for initialization failures
          });
        }
      },

      checkBiometricAvailability: async () => {
        try {
          const isAvailable = await authService.isBiometricAvailable();
          const biometricTypes = await authService.getBiometricType();
          const hasCredentials = await authService.hasBiometricCredentials();
          
          set({
            biometricAvailable: isAvailable,
            biometricType: biometricTypes.map(type => {
              switch (type) {
                case 1: return 'Touch ID';
                case 2: return 'Face ID';
                case 3: return 'Iris';
                default: return 'Biometric';
              }
            }),
            biometricEnabled: hasCredentials,
          });
        } catch (error) {
          console.error('Failed to check biometric availability:', error);
          set({
            biometricAvailable: false,
            biometricType: [],
            biometricEnabled: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist user and authentication status
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        biometricEnabled: state.biometricEnabled,
      }),
    }
  )
);

// Helper hooks for components
export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    login: store.login,
    register: store.register,
    logout: store.logout,
    clearError: store.clearError,
  };
};

export const useBiometricAuth = () => {
  const store = useAuthStore();
  return {
    biometricEnabled: store.biometricEnabled,
    biometricAvailable: store.biometricAvailable,
    biometricType: store.biometricType,
    loginWithBiometrics: store.loginWithBiometrics,
    enableBiometricAuth: store.enableBiometricAuth,
    disableBiometricAuth: store.disableBiometricAuth,
    checkBiometricAvailability: store.checkBiometricAvailability,
  };
};

export const useEmailVerification = () => {
  const store = useAuthStore();
  return {
    verifyEmail: store.verifyEmail,
    resendVerificationEmail: store.resendVerificationEmail,
    isLoading: store.isLoading,
    error: store.error,
    clearError: store.clearError,
  };
};

export const usePasswordReset = () => {
  const store = useAuthStore();
  return {
    forgotPassword: store.forgotPassword,
    resetPassword: store.resetPassword,
    isLoading: store.isLoading,
    error: store.error,
    clearError: store.clearError,
  };
};