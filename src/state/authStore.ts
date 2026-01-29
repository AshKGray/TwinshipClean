import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Session } from '@supabase/supabase-js';
import { authService } from '../services/authService';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, profileData: { name: string; twinType?: string; accentColor?: string }) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  initializeAuth: () => Promise<() => void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.signIn(email, password);
          if (result.success) {
            set({
              user: result.user ?? null,
              session: result.session ?? null,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ isLoading: false, error: result.error || 'Login failed' });
            throw new Error(result.error);
          }
        } catch (error: any) {
          set({ isLoading: false, error: error.message || 'Login failed' });
          throw error;
        }
      },

      register: async (email, password, profileData) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.signUp(email, password, profileData);
          if (result.success) {
            set({
              user: result.user ?? null,
              session: result.session ?? null,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ isLoading: false, error: result.error || 'Registration failed' });
            throw new Error(result.error);
          }
        } catch (error: any) {
          set({ isLoading: false, error: error.message || 'Registration failed' });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.signOut();
        } catch (e) {
          console.error('Logout error:', e);
        }
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.sendPasswordReset(email);
          if (result.success) {
            set({ isLoading: false, error: 'Password reset email sent. Check your inbox.' });
          } else {
            set({ isLoading: false, error: result.error || 'Password reset failed' });
            throw new Error(result.error);
          }
        } catch (error: any) {
          set({ isLoading: false, error: error.message || 'Password reset failed' });
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setSession: (session) => set({ session, user: session?.user ?? null, isAuthenticated: !!session }),

      initializeAuth: async () => {
        set({ isLoading: true });
        try {
          const session = await authService.getSession();
          if (session) {
            set({
              user: session.user,
              session,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (e) {
          console.error('Auth init error:', e);
          set({ isLoading: false });
        }

        const { data } = authService.onAuthStateChange((user, session) => {
          set({
            user,
            session,
            isAuthenticated: !!user,
          });
        });

        return () => data.subscription.unsubscribe();
      },
    }),
    {
      name: 'twinship-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Convenience hooks
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

export const usePasswordReset = () => {
  const store = useAuthStore();
  return {
    forgotPassword: store.forgotPassword,
    isLoading: store.isLoading,
    error: store.error,
    clearError: store.clearError,
  };
};
