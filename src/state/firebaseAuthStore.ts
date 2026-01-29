/**
 * Firebase Auth Store - Zustand state management for Firebase authentication
 *
 * Simplified auth store specifically for Firebase Auth integration.
 * Replaces the old custom backend auth system.
 *
 * Story: 7-2 User Authentication with Firebase
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from 'firebase/auth';

interface FirebaseAuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  clearError: () => void;
}

export const useFirebaseAuthStore = create<FirebaseAuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        error: null
      }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearAuth: () => set({
        user: null,
        isAuthenticated: false,
        error: null
      }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'twinship-firebase-auth',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist user object (Firebase handles session persistence)
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Convenience hook for components
export const useFirebaseAuth = () => {
  const store = useFirebaseAuthStore();
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    clearError: store.clearError,
  };
};
