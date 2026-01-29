/**
 * Firebase Authentication Service (STUBBED)
 *
 * Temporarily disabled due to Expo Go compatibility issues.
 * Will be re-enabled when moving to development build.
 *
 * Story: 7-2 User Authentication with Firebase
 */

import type { UserProfile } from '@/types';

export interface AuthResult {
  success: boolean;
  user?: any;
  profile?: UserProfile;
  error?: string;
}

class FirebaseAuthService {
  /**
   * Initialize auth state listener (STUBBED)
   */
  initAuthListener() {
    console.warn('⚠️  Firebase Auth is temporarily disabled (Expo Go limitation)');
    // No-op for now
  }

  /**
   * Sign up new user (STUBBED)
   */
  async signUp(
    email: string,
    password: string,
    profileData: Partial<UserProfile>
  ): Promise<AuthResult> {
    console.warn('⚠️  Firebase Auth is temporarily disabled');
    return {
      success: false,
      error: 'Authentication is temporarily disabled. Please use a development build.'
    };
  }

  /**
   * Sign in existing user (STUBBED)
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    console.warn('⚠️  Firebase Auth is temporarily disabled');
    return {
      success: false,
      error: 'Authentication is temporarily disabled. Please use a development build.'
    };
  }

  /**
   * Sign out current user (STUBBED)
   */
  async signOut(): Promise<void> {
    console.warn('⚠️  Firebase Auth is temporarily disabled');
  }

  /**
   * Send password reset email (STUBBED)
   */
  async sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    console.warn('⚠️  Firebase Auth is temporarily disabled');
    return { success: false, error: 'Authentication is temporarily disabled' };
  }

  /**
   * Update user password (STUBBED)
   */
  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    console.warn('⚠️  Firebase Auth is temporarily disabled');
    return { success: false, error: 'Authentication is temporarily disabled' };
  }

  /**
   * Get current user (STUBBED)
   */
  getCurrentUser(): null {
    return null;
  }
}

// Export singleton instance
export const firebaseAuthService = new FirebaseAuthService();
