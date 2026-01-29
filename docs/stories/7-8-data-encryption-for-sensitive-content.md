# Story 7.8: Data Encryption for Sensitive Content

**Epic**: 7 - Data Synchronization & Backend
**Status**: drafted
**Story ID**: 7-8
**Estimated Effort**: Medium (6-7 hours)

---

## User Story

**As a** user
**I want** my personal data encrypted before being stored in the cloud
**So that** my privacy is protected and only my twin and I can read our shared content

## Business Value

End-to-end encryption is a critical trust signal for users sharing intimate stories, personal thoughts, and synchronicity data. By encrypting sensitive content before it reaches Firebase, Twinship ensures that even if the backend is compromised, user data remains private and secure.

## Acceptance Criteria

1. ✅ Story titles and content encrypted before Firestore upload
2. ✅ Twintuition alert messages encrypted if present
3. ✅ User profile names and birthdates encrypted in Firestore
4. ✅ Encryption uses AES-256 algorithm
5. ✅ Encryption keys derived from user password using PBKDF2
6. ✅ Keys stored securely in Expo SecureStore (iOS Keychain, Android Keystore)
7. ✅ Decryption successful on retrieval (plaintext visible to user)
8. ✅ Key hash stored for verification
9. ✅ Twin pair shared key for collaborative content (Phase 2 enhancement)
10. ✅ Encryption/decryption transparent to user (no visible delay)
11. ✅ Encryption operations complete in < 50ms
12. ✅ Key recovery mechanism (or clear warning about data loss if password forgotten)

## Technical Implementation Notes

### Encryption Service

Create `src/services/firebase/encryption.ts`:

```typescript
import CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const ENCRYPTION_ALGORITHM = 'AES-256';
const PBKDF2_ITERATIONS = 10000;
const PBKDF2_KEY_SIZE = 256 / 32; // 256 bits = 32 bytes

export class EncryptionService {
  /**
   * Generate random encryption key (AES-256)
   */
  async generateKey(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(32); // 256 bits
    return this.bytesToHex(randomBytes);
  }

  /**
   * Derive encryption key from password using PBKDF2
   */
  async deriveKeyFromPassword(password: string, salt: string): Promise<string> {
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: PBKDF2_KEY_SIZE,
      iterations: PBKDF2_ITERATIONS,
    });

    return key.toString();
  }

  /**
   * Encrypt plaintext using AES-256
   */
  async encrypt(plainText: string, key: string): Promise<string> {
    try {
      const encrypted = CryptoJS.AES.encrypt(plainText, key);
      return encrypted.toString();
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt ciphertext using AES-256
   */
  async decrypt(cipherText: string, key: string): Promise<string> {
    try {
      const decrypted = CryptoJS.AES.decrypt(cipherText, key);
      const plainText = decrypted.toString(CryptoJS.enc.Utf8);

      if (!plainText) {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }

      return plainText;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash key for verification (SHA-256)
   */
  async hashKey(key: string): Promise<string> {
    const hash = CryptoJS.SHA256(key);
    return hash.toString();
  }

  /**
   * Store encryption key securely
   */
  async storeKey(userId: string, key: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(`encryption_key_${userId}`, key);
    } catch (error) {
      console.error('Error storing encryption key:', error);
      throw new Error('Failed to store encryption key securely');
    }
  }

  /**
   * Retrieve encryption key
   */
  async getKey(userId: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(`encryption_key_${userId}`);
    } catch (error) {
      console.error('Error retrieving encryption key:', error);
      return null;
    }
  }

  /**
   * Delete encryption key
   */
  async deleteKey(userId: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(`encryption_key_${userId}`);
    } catch (error) {
      console.error('Error deleting encryption key:', error);
    }
  }

  /**
   * Verify key hash matches
   */
  async verifyKeyHash(key: string, storedHash: string): Promise<boolean> {
    const computedHash = await this.hashKey(key);
    return computedHash === storedHash;
  }

  /**
   * Generate shared twin pair key (for collaborative content)
   * Phase 2: Encrypt with both user keys
   */
  async generateSharedKey(): Promise<string> {
    return this.generateKey();
  }

  /**
   * Encrypt shared key with user key (for storage)
   */
  async encryptSharedKey(sharedKey: string, userKey: string): Promise<string> {
    return this.encrypt(sharedKey, userKey);
  }

  /**
   * Decrypt shared key with user key
   */
  async decryptSharedKey(encryptedSharedKey: string, userKey: string): Promise<string> {
    return this.decrypt(encryptedSharedKey, userKey);
  }

  /**
   * Helper: Convert bytes to hex string
   */
  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Helper: Convert hex string to bytes
   */
  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
```

### Integration Example (Story Sync)

Update `src/services/firebase/storiesSync.ts` to use encryption:

```typescript
// Already implemented in Story 7.4, but here's the pattern:

async createStory(twinPairId: string, story: Story): Promise<void> {
  // Get encryption key
  const encryptionKey = await SecureStore.getItemAsync(`encryption_key_${userId}`);
  if (!encryptionKey) throw new Error('Encryption key not found');

  // Encrypt sensitive fields
  const encryptedTitle = await this.encryptionService.encrypt(story.title, encryptionKey);
  const encryptedContent = await this.encryptionService.encrypt(story.content, encryptionKey);

  // Store encrypted data in Firestore
  const storyDoc = {
    title: encryptedTitle,
    content: encryptedContent,
    // ... other fields
  };

  await firestoreService.createDocument(storiesPath, story.id, storyDoc);
}

// On retrieval:
subscribeToStories(twinPairId: string, callback: (stories: Story[]) => void): Unsubscribe {
  return onSnapshot(query, async (snapshot) => {
    const encryptionKey = await SecureStore.getItemAsync(`encryption_key_${userId}`);

    const stories = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();

        // Decrypt sensitive fields
        const decryptedTitle = await this.encryptionService.decrypt(data.title, encryptionKey);
        const decryptedContent = await this.encryptionService.decrypt(data.content, encryptionKey);

        return {
          ...data,
          title: decryptedTitle,
          content: decryptedContent,
        };
      })
    );

    callback(stories);
  });
}
```

### Password Change Flow

When user changes password, re-derive encryption key:

```typescript
// In firebase/auth.ts
async updatePassword(newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No user signed in');

  // Update password in Firebase Auth
  await firebaseUpdatePassword(user, newPassword);

  // Re-derive encryption key with new password
  const newEncryptionKey = await encryptionService.deriveKeyFromPassword(
    newPassword,
    user.uid // salt
  );

  // Store new key
  await encryptionService.storeKey(user.uid, newEncryptionKey);

  // IMPORTANT: In Phase 2, re-encrypt all user data with new key
  // For MVP, warn user that changing password will require re-pairing
}
```

### Warning UI for Password Loss

Add prominent warning during sign-up:

```typescript
// In RegisterScreen.tsx
<View className="bg-yellow-500/20 p-4 rounded-lg mb-4">
  <Text className="text-yellow-300 font-semibold">
    ⚠️ Important: Password Recovery
  </Text>
  <Text className="text-yellow-200 text-sm mt-2">
    Your password encrypts your data. If you forget it, we CANNOT recover your stories or personal information.
    Please store it securely (e.g., password manager).
  </Text>
</View>
```

## Dependencies

### Upstream Dependencies
- Story 7.1: Firebase Project Setup and Configuration
- Story 7.2: User Authentication with Firebase (key derivation during sign-up/sign-in)

### Downstream Dependencies
- Story 7.4: Real-Time Story Synchronization (uses encryption)
- Story 7.5: Real-Time Twintuition Alert Delivery (uses encryption)

## Files to Create/Modify

### New Files:
- `src/services/firebase/encryption.ts` - Encryption service

### Modified Files:
- `src/services/firebase/auth.ts` - Integrate key derivation and storage
- `src/services/firebase/storiesSync.ts` - Already encrypts (verify implementation)
- `src/services/firebase/twintuitionSync.ts` - Already encrypts (verify implementation)
- `src/screens/auth/RegisterScreen.tsx` - Add password warning UI

### NPM Dependencies:
```bash
npm install crypto-js
npm install @types/crypto-js --save-dev
```

## Testing Strategy

### Unit Tests
- ✅ generateKey creates 256-bit key
- ✅ deriveKeyFromPassword produces consistent keys
- ✅ encrypt produces ciphertext different from plaintext
- ✅ decrypt reverses encryption correctly
- ✅ decrypt with wrong key fails
- ✅ hashKey produces consistent hash
- ✅ verifyKeyHash correctly validates

### Integration Tests
- ✅ Store key in SecureStore, retrieve successfully
- ✅ Encrypt story title, store in Firestore, decrypt on retrieval
- ✅ Sign up → Key derived → Key stored
- ✅ Sign in → Key derived → Key matches stored hash
- ✅ Change password → New key derived → Old data inaccessible (warn user)

### Security Tests
- ✅ Encrypted data in Firestore is unreadable without key
- ✅ Key not stored in AsyncStorage (only SecureStore)
- ✅ Key not logged or exposed in error messages
- ✅ AES-256 algorithm verified
- ✅ PBKDF2 uses sufficient iterations (10,000+)

### Performance Tests
- ✅ Encryption < 50ms for typical story (1000 characters)
- ✅ Decryption < 50ms
- ✅ Key derivation < 1 second (acceptable for sign-up/sign-in)

### Manual Testing Checklist
- [ ] Sign up, verify key in SecureStore (use iOS/Android dev tools)
- [ ] Create encrypted story, view in Firestore Console (should be gibberish)
- [ ] Retrieve story, verify decrypted correctly
- [ ] Sign out, sign in, verify decryption still works
- [ ] Attempt to decrypt with wrong password (should fail)
- [ ] Verify warning about password loss displayed during sign-up

## Definition of Done

- [ ] All acceptance criteria met and verified
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Security tests passing
- [ ] Performance tests passing (< 50ms encryption/decryption)
- [ ] Manual testing checklist completed
- [ ] Encrypted data verified in Firestore Console
- [ ] Key storage verified in SecureStore
- [ ] Warning UI about password loss implemented
- [ ] Code reviewed and approved (security review)
- [ ] Documentation updated
- [ ] Sprint status updated to "done"

## Risk & Mitigation

**Risk**: User forgets password, loses all encrypted data
- **Mitigation**: Prominent warning during sign-up, recommend password manager, consider key recovery mechanism in Phase 2

**Risk**: Encryption key leaked or compromised
- **Mitigation**: Use SecureStore (hardware-backed on iOS/Android), never log keys, rotate keys on password change

**Risk**: Performance impact from encryption/decryption
- **Mitigation**: Optimize algorithm, use native crypto where possible, cache decrypted data in memory

**Risk**: Encryption library vulnerability
- **Mitigation**: Use well-maintained library (crypto-js), keep dependencies updated, security audits

## Notes for Implementation

1. **Use AES-256**: Industry standard, well-tested, performant
2. **PBKDF2 iterations**: 10,000+ iterations prevents brute-force attacks
3. **SecureStore**: Hardware-backed on both iOS (Keychain) and Android (Keystore)
4. **Key derivation salt**: Use user UID as salt for consistency
5. **Never log keys**: Be extremely careful not to log encryption keys or plaintext in production
6. **Shared twin key (Phase 2)**: For collaborative content, generate shared key and encrypt with both user keys

---

**Related Documentation**:
- [Epic 7 Tech Spec](/docs/tech-spec-epic-7.md)
- [Expo SecureStore Documentation](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [CryptoJS Documentation](https://github.com/brix/crypto-js)

**Story Owner**: Security Team / Backend Team
**Last Updated**: 2025-11-18
