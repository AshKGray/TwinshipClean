/**
 * Firebase Authentication Service - PRODUCTION VERSION
 *
 * Full Firebase Auth implementation with AsyncStorage persistence.
 * Use this file when building development/production builds.
 *
 * Story: 7-2 User Authentication with Firebase
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  onAuthStateChanged,
  type User,
  type Unsubscribe,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase.config';
import * as SecureStore from 'expo-secure-store';
import { EncryptionService } from '@/services/encryptionService';
import type { UserProfile } from '@/types';

export interface AuthResult {
  success: boolean;
  user?: User;
  profile?: UserProfile;
  error?: string;
}

class FirebaseAuthService {
  private authStateListener: Unsubscribe | null = null;

  constructor() {
    // Set up auth persistence using AsyncStorage-compatible persistence
    this.initPersistence();
  }

  /**
   * Initialize auth persistence
   */
  private async initPersistence() {
    try {
      // Firebase Auth will automatically use indexedDB in React Native
      // For Expo, we rely on Firebase's built-in persistence
      await setPersistence(auth, browserLocalPersistence);
      console.log('✅ Firebase Auth persistence configured');
    } catch (error) {
      console.warn('⚠️  Could not set auth persistence:', error);
    }
  }

  /**
   * Initialize auth state listener
   * Call this once when app starts
   */
  initAuthListener(
    onAuthChange: (user: User | null) => void
  ): Unsubscribe {
    this.authStateListener = onAuthStateChanged(auth, async (user) => {
      console.log('🔐 Auth state changed:', user ? `User ${user.uid}` : 'No user');
      onAuthChange(user);

      if (user) {
        // Load user profile from Firestore when auth state changes
        await this.loadUserProfile(user.uid);
      }
    });

    return this.authStateListener;
  }

  /**
   * Sign up new user with email and password
   */
  async signUp(
    email: string,
    password: string,
    profileData: Partial<UserProfile>
  ): Promise<AuthResult> {
    try {
      console.log('📝 Signing up user:', email);

      // Validate input
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      if (!this.isValidPassword(password)) {
        throw new Error('Password must be at least 8 characters');
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('✅ Firebase Auth user created:', user.uid);

      // Derive encryption key from password
      const encryptionKey = await EncryptionService.deriveKeyFromPassword(
        password,
        user.uid // Use UID as salt
      );

      // Store encryption key securely
      await SecureStore.setItemAsync(`encryption_key_${user.uid}`, encryptionKey);
      console.log('✅ Encryption key stored securely');

      // Encrypt sensitive profile fields
      const encryptedName = await EncryptionService.encryptWithProvidedKey(
        profileData.name || '',
        encryptionKey
      );
      const encryptedBirthdate = await EncryptionService.encryptWithProvidedKey(
        profileData.birthdate || '',
        encryptionKey
      );

      // Hash encryption key for verification
      const encryptionKeyHash = await EncryptionService.generateHash(encryptionKey);

      // Create user profile in Firestore
      const userProfile: Partial<UserProfile> = {
        id: user.uid,
        email: user.email!,
        name: encryptedName,
        birthdate: encryptedBirthdate,
        twinType: profileData.twinType || 'other',
        accentColor: profileData.accentColor || 'celestial-indigo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', user.uid), {
        ...userProfile,
        encryptionKeyHash,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('✅ User profile created in Firestore');

      return {
        success: true,
        user,
        profile: userProfile as UserProfile
      };

    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Sign in existing user
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      console.log('🔐 Signing in user:', email);

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('✅ Firebase Auth sign in successful:', user.uid);

      // Derive encryption key from password
      const encryptionKey = await EncryptionService.deriveKeyFromPassword(
        password,
        user.uid
      );

      // Store encryption key securely
      await SecureStore.setItemAsync(`encryption_key_${user.uid}`, encryptionKey);
      console.log('✅ Encryption key stored securely');

      // Load user profile from Firestore
      const profile = await this.loadUserProfile(user.uid);

      return {
        success: true,
        user,
        profile
      };

    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Load user profile from Firestore and decrypt
   */
  private async loadUserProfile(userId: string): Promise<UserProfile | undefined> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const encryptedProfile = docSnap.data() as any;

        // Get encryption key from SecureStore
        const encryptionKey = await SecureStore.getItemAsync(`encryption_key_${userId}`);

        if (!encryptionKey) {
          console.warn('⚠️  Encryption key not found for user:', userId);
          // Return profile with encrypted fields if key not available
          return encryptedProfile as UserProfile;
        }

        // Decrypt sensitive fields
        let decryptedName = encryptedProfile.name;
        let decryptedBirthdate = encryptedProfile.birthdate;

        try {
          decryptedName = await EncryptionService.decryptWithProvidedKey(
            encryptedProfile.name,
            encryptionKey
          );
          decryptedBirthdate = await EncryptionService.decryptWithProvidedKey(
            encryptedProfile.birthdate,
            encryptionKey
          );
        } catch (decryptError) {
          console.warn('⚠️  Could not decrypt profile fields:', decryptError);
        }

        const profile: UserProfile = {
          ...encryptedProfile,
          name: decryptedName,
          birthdate: decryptedBirthdate,
        };

        console.log('✅ User profile loaded and decrypted');
        return profile;
      } else {
        console.warn('⚠️  User profile not found in Firestore:', userId);
      }
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      const user = auth.currentUser;

      await firebaseSignOut(auth);
      console.log('✅ User signed out');

      // Clear encryption key
      if (user) {
        await SecureStore.deleteItemAsync(`encryption_key_${user.uid}`);
        console.log('✅ Encryption key cleared');
      }

    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent to:', email);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Password reset error:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user signed in');
      }

      if (!this.isValidPassword(newPassword)) {
        throw new Error('Password must be at least 8 characters');
      }

      await firebaseUpdatePassword(user, newPassword);
      console.log('✅ Password updated');

      // Re-derive encryption key with new password
      const newEncryptionKey = await EncryptionService.deriveKeyFromPassword(
        newPassword,
        user.uid
      );

      await SecureStore.setItemAsync(`encryption_key_${user.uid}`, newEncryptionKey);
      console.log('✅ Encryption key re-derived and stored');

      // Note: In production, you would need to re-encrypt all user data with new key
      // For MVP, we just update the key and warn about potential data access issues

      return { success: true };
    } catch (error: any) {
      console.error('❌ Password update error:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return auth.currentUser !== null;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password requirements
   */
  private isValidPassword(password: string): boolean {
    return password.length >= 8;
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered';
      case 'auth/invalid-email':
        return 'Invalid email format';
      case 'auth/operation-not-allowed':
        return 'Email/password sign-in is disabled';
      case 'auth/weak-password':
        return 'Password is too weak';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/user-not-found':
        return 'Invalid email or password';
      case 'auth/wrong-password':
        return 'Invalid email or password';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/requires-recent-login':
        return 'This operation requires recent authentication. Please sign in again';
      default:
        return error.message || 'An error occurred';
    }
  }

  /**
   * Cleanup listeners
   */
  destroy(): void {
    if (this.authStateListener) {
      this.authStateListener();
      this.authStateListener = null;
    }
  }
}

// Export singleton instance
export const firebaseAuthService = new FirebaseAuthService();
