# Story 7.2: User Authentication with Firebase

**Epic**: 7 - Data Synchronization & Backend
**Status**: drafted
**Story ID**: 7-2
**Estimated Effort**: Medium (5-6 hours)

---

## User Story

**As a** user
**I want** secure authentication with email and password
**So that** my data is protected and synced to the cloud

## Business Value

Authentication is the gateway to all real-time features. By implementing Firebase Auth, users can securely access their twin connection data from any device, ensuring data privacy and enabling seamless collaboration with their twin across stories, games, and Twintuition alerts.

## Acceptance Criteria

1. ✅ User can sign up with email and password
2. ✅ Email validation enforced (valid email format required)
3. ✅ Password requirements enforced (minimum 8 characters)
4. ✅ User document created in Firestore (`users/{userId}`) upon successful sign-up
5. ✅ User can sign in with valid credentials
6. ✅ Invalid credentials show clear error message ("Invalid email or password")
7. ✅ Password reset email can be sent via "Forgot Password" link
8. ✅ Auth state persists across app restarts (user remains logged in)
9. ✅ User can sign out successfully
10. ✅ Auth state synced with `authStore` Zustand store
11. ✅ Encryption key derived from password and stored in SecureStore
12. ✅ Sign-in completes in < 3 seconds on good network connection

## Technical Implementation Notes

### Zustand Auth Store

Create `src/state/authStore.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

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
    }),
    {
      name: 'twinship-auth',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
      // Don't persist user object (Firebase handles session)
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    }
  )
);
```

### Firebase Auth Service

Create `src/services/firebase/auth.ts`:

```typescript
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  onAuthStateChanged,
  User,
  type Unsubscribe
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase.config';
import { useAuthStore } from '@/state/authStore';
import { useTwinStore } from '@/state/twinStore';
import { EncryptionService } from './encryption';
import * as SecureStore from 'expo-secure-store';
import type { UserProfile } from '@/types';

export interface AuthResult {
  success: boolean;
  user?: User;
  profile?: UserProfile;
  error?: string;
}

class FirebaseAuthService {
  private encryptionService: EncryptionService;

  constructor() {
    this.encryptionService = new EncryptionService();
    this.initAuthListener();
  }

  /**
   * Listen to auth state changes and update store
   */
  private initAuthListener() {
    onAuthStateChanged(auth, async (user) => {
      const { setUser } = useAuthStore.getState();

      if (user) {
        setUser(user);
        // Load user profile from Firestore
        await this.loadUserProfile(user.uid);
      } else {
        setUser(null);
        useTwinStore.getState().clearUserData();
      }
    });
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
      const { setLoading, setError } = useAuthStore.getState();
      setLoading(true);
      setError(null);

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

      // Derive encryption key from password
      const encryptionKey = await this.encryptionService.deriveKeyFromPassword(
        password,
        user.uid // Use UID as salt
      );

      // Store encryption key securely
      await SecureStore.setItemAsync(`encryption_key_${user.uid}`, encryptionKey);

      // Encrypt sensitive profile fields
      const encryptedName = await this.encryptionService.encrypt(
        profileData.name || '',
        encryptionKey
      );
      const encryptedBirthdate = await this.encryptionService.encrypt(
        profileData.birthdate || '',
        encryptionKey
      );

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        id: user.uid,
        email: user.email!,
        name: encryptedName,
        birthdate: encryptedBirthdate,
        twinType: profileData.twinType || 'other',
        accentColor: profileData.accentColor || 'celestial-indigo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);

      // Save to local store (decrypted)
      useTwinStore.getState().setUserProfile({
        ...userProfile,
        name: profileData.name!,
        birthdate: profileData.birthdate!,
      });

      setLoading(false);
      return { success: true, user, profile: userProfile };

    } catch (error: any) {
      const { setError, setLoading } = useAuthStore.getState();
      const errorMessage = this.getErrorMessage(error);
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sign in existing user
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { setLoading, setError } = useAuthStore.getState();
      setLoading(true);
      setError(null);

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Derive encryption key from password
      const encryptionKey = await this.encryptionService.deriveKeyFromPassword(
        password,
        user.uid
      );

      // Store encryption key securely
      await SecureStore.setItemAsync(`encryption_key_${user.uid}`, encryptionKey);

      // Load user profile from Firestore
      const profile = await this.loadUserProfile(user.uid);

      setLoading(false);
      return { success: true, user, profile };

    } catch (error: any) {
      const { setError, setLoading } = useAuthStore.getState();
      const errorMessage = this.getErrorMessage(error);
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
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
        const encryptedProfile = docSnap.data() as UserProfile;

        // Get encryption key from SecureStore
        const encryptionKey = await SecureStore.getItemAsync(`encryption_key_${userId}`);

        if (!encryptionKey) {
          throw new Error('Encryption key not found');
        }

        // Decrypt sensitive fields
        const decryptedName = await this.encryptionService.decrypt(
          encryptedProfile.name,
          encryptionKey
        );
        const decryptedBirthdate = await this.encryptionService.decrypt(
          encryptedProfile.birthdate,
          encryptionKey
        );

        const profile: UserProfile = {
          ...encryptedProfile,
          name: decryptedName,
          birthdate: decryptedBirthdate,
        };

        // Save to local store
        useTwinStore.getState().setUserProfile(profile);

        return profile;
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);

      // Clear encryption key
      const user = auth.currentUser;
      if (user) {
        await SecureStore.deleteItemAsync(`encryption_key_${user.uid}`);
      }

      // Clear stores
      useAuthStore.getState().clearAuth();
      useTwinStore.getState().clearUserData();

    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
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

      // Re-derive encryption key with new password
      const newEncryptionKey = await this.encryptionService.deriveKeyFromPassword(
        newPassword,
        user.uid
      );

      await SecureStore.setItemAsync(`encryption_key_${user.uid}`, newEncryptionKey);

      return { success: true };
    } catch (error: any) {
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
      default:
        return error.message || 'An error occurred';
    }
  }
}

// Export singleton instance
export const firebaseAuthService = new FirebaseAuthService();
```

### Update RegisterScreen to use Firebase Auth

Modify `src/screens/auth/RegisterScreen.tsx` to integrate Firebase:

```typescript
// Add Firebase auth import
import { firebaseAuthService } from '@/services/firebase/auth';

// In handleSubmit function:
const handleSubmit = async () => {
  // ... existing validation ...

  try {
    setIsLoading(true);

    const result = await firebaseAuthService.signUp(
      email,
      password,
      {
        name,
        birthdate,
        twinType,
        accentColor: 'celestial-indigo', // Default, will be set in color selection
      }
    );

    if (result.success) {
      // Navigate to color selection
      navigation.navigate('ColorSelection');
    } else {
      setError(result.error || 'Sign up failed');
    }
  } catch (err) {
    setError('An unexpected error occurred');
  } finally {
    setIsLoading(false);
  }
};
```

## Dependencies

### Upstream Dependencies
- Story 7.1: Firebase Project Setup and Configuration (must be complete)

### Downstream Dependencies
- Story 7.3: Firestore Data Models and Schema
- Story 7.4: Real-Time Story Synchronization
- All other Epic 7 stories (require auth)

## Files to Create/Modify

### New Files:
- `src/state/authStore.ts` - Zustand auth state management
- `src/services/firebase/auth.ts` - Firebase auth service
- `src/screens/auth/SignInScreen.tsx` - Sign-in UI (if doesn't exist)
- `src/screens/auth/ForgotPasswordScreen.tsx` - Password reset UI

### Modified Files:
- `src/screens/auth/RegisterScreen.tsx` - Integrate Firebase sign-up
- `src/navigation/AppNavigator.tsx` - Add auth flow routing
- `App.tsx` - Initialize auth listener on app start

## Testing Strategy

### Unit Tests
- ✅ Email validation accepts valid emails
- ✅ Email validation rejects invalid emails
- ✅ Password validation enforces 8-character minimum
- ✅ Error message mapping returns correct messages
- ✅ authStore updates when user signs in/out

### Integration Tests
- ✅ Sign up creates user in Firebase Auth
- ✅ Sign up creates user document in Firestore
- ✅ Sign up derives and stores encryption key
- ✅ Sign in retrieves user profile from Firestore
- ✅ Sign in decrypts profile fields correctly
- ✅ Sign out clears auth state and encryption key
- ✅ Password reset email sends successfully
- ✅ Auth state persists across app restart

### E2E Tests
- ✅ User can complete sign-up flow end-to-end
- ✅ User can sign in with valid credentials
- ✅ User cannot sign in with invalid credentials
- ✅ User can request password reset
- ✅ User remains signed in after app restart
- ✅ User can sign out and auth state clears

### Manual Testing Checklist
- [ ] Sign up with valid email and password
- [ ] Verify user appears in Firebase Auth console
- [ ] Verify user document created in Firestore
- [ ] Sign in with created account
- [ ] Sign in with wrong password shows error
- [ ] Sign in with non-existent email shows error
- [ ] Password reset email received
- [ ] Sign out clears user data
- [ ] Kill app, restart, user still signed in
- [ ] Test on both iOS and Android

## Definition of Done

- [ ] All acceptance criteria met and verified
- [ ] Unit tests written and passing (80%+ coverage)
- [ ] Integration tests written and passing
- [ ] E2E tests written and passing
- [ ] Manual testing checklist completed
- [ ] Code reviewed and approved
- [ ] No security vulnerabilities (password stored securely)
- [ ] Auth state persists correctly
- [ ] Error handling comprehensive
- [ ] Documentation updated
- [ ] Sprint status updated to "done"

## Risk & Mitigation

**Risk**: Encryption key lost if user forgets password
- **Mitigation**: Warn users during sign-up, implement key recovery in Phase 2

**Risk**: Auth state desync between Firebase and local store
- **Mitigation**: Use `onAuthStateChanged` listener as single source of truth

**Risk**: Insecure password storage
- **Mitigation**: Firebase handles password hashing, never store passwords locally

## Notes for Implementation

1. **Use Firebase error codes**: Map Firebase error codes to user-friendly messages
2. **Encryption key management**: Store keys in SecureStore, never in AsyncStorage
3. **Auth state listener**: Initialize once in App.tsx, not in every screen
4. **Password validation**: Enforce minimum 8 characters, consider adding strength meter
5. **Testing with emulator**: Use Firebase Auth Emulator for local testing

---

**Related Documentation**:
- [Epic 7 Tech Spec](/docs/tech-spec-epic-7.md)
- [Story 7.1: Firebase Setup](/docs/stories/7-1-firebase-project-setup-and-configuration.md)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth/web/start)

**Story Owner**: Backend Team
**Last Updated**: 2025-11-18
