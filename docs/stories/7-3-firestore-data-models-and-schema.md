# Story 7.3: Firestore Data Models and Schema

**Epic**: 7 - Data Synchronization & Backend
**Status**: drafted
**Story ID**: 7-3
**Estimated Effort**: Small (3-4 hours)

---

## User Story

**As a** developer
**I want** well-structured Firestore data models and schema
**So that** data is organized, queryable, and follows best practices

## Business Value

A well-designed database schema is critical for app performance, scalability, and maintainability. This story establishes the data architecture that will support all real-time features, ensuring efficient queries, proper security isolation between twin pairs, and version tracking for conflict resolution.

## Acceptance Criteria

1. ✅ Users collection (`users/{userId}`) defined with schema
2. ✅ TwinPairs collection (`twinPairs/{pairId}`) defined
3. ✅ Stories subcollection (`twinPairs/{pairId}/stories/{storyId}`) defined
4. ✅ Alerts subcollection (`twinPairs/{pairId}/alerts/{alertId}`) defined
5. ✅ Games subcollection (`twinPairs/{pairId}/games/{gameId}`) defined
6. ✅ TypeScript interfaces created for all document types
7. ✅ Security rules enforce twin-pair isolation (tested)
8. ✅ Security rules prevent unauthorized access (tested)
9. ✅ Composite indexes created for frequently queried fields
10. ✅ Version field included in documents requiring conflict detection
11. ✅ Timestamps use Firestore Timestamp type consistently
12. ✅ All document schemas validated with unit tests

## Technical Implementation Notes

### TypeScript Data Models

Create `src/models/firebase/schema.ts`:

```typescript
import type { Timestamp } from 'firebase/firestore';

/**
 * User Profile Document
 * Collection: users/{userId}
 */
export interface UserProfileDoc {
  id: string;                         // Firebase Auth UID
  email: string;                      // User email (from Firebase Auth)
  name: string;                       // Encrypted with user key
  birthdate: string;                  // Encrypted
  twinType: 'identical' | 'fraternal' | 'other';
  accentColor: ThemeColor;
  twinId?: string;                    // Reference to twin's user ID
  twinPairId?: string;                // Reference to twinPairs document
  createdAt: Timestamp;               // Firestore Timestamp
  updatedAt: Timestamp;
  encryptionKeyHash?: string;         // Hash for key verification
}

/**
 * Twin Pair Document
 * Collection: twinPairs/{pairId}
 */
export interface TwinPairDoc {
  id: string;                         // UUID v4
  twin1Id: string;                    // User ID of first twin
  twin2Id: string;                    // User ID of second twin
  pairedAt: Timestamp;
  invitationId: string;               // Reference to invitation
  sharedEncryptionKey?: string;       // Encrypted with both user keys
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Story Document
 * Collection: twinPairs/{pairId}/stories/{storyId}
 */
export interface StoryDoc {
  id: string;
  title: string;                      // Encrypted
  content: string;                    // Encrypted
  createdBy: string;                  // User ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;                  // User ID of last editor
  mediaUrls?: string[];               // Encrypted URLs (Phase 2: Firebase Storage)
  tags?: string[];
  version: number;                    // For conflict resolution
  editHistory?: EditEntry[];          // Track edits
  isDeleted?: boolean;                // Soft delete flag
  deletedAt?: Timestamp;
}

export interface EditEntry {
  userId: string;
  timestamp: Timestamp;
  changes: string;                    // Summary of changes
}

/**
 * Twintuition Alert Document
 * Collection: twinPairs/{pairId}/alerts/{alertId}
 */
export interface TwintuitionAlertDoc {
  id: string;
  type: 'feeling' | 'thought' | 'action';
  emotion?: EmotionWord;
  intensity?: number;                 // 1-10
  message?: string;                   // Encrypted (max 100 chars)
  senderId: string;                   // User ID who sent
  recipientId: string;                // User ID who receives
  sentAt: Timestamp;
  seenAt?: Timestamp;
  respondedAt?: Timestamp;
  expiresAt: Timestamp;               // Auto-delete after 24 hours
  isDeleted?: boolean;
}

export type EmotionWord = 'joy' | 'sadness' | 'anger' | 'fear' |
                          'surprise' | 'disgust' | 'trust' | 'anticipation';

/**
 * Game Session Document
 * Collection: twinPairs/{pairId}/games/{gameId}
 */
export interface GameSessionDoc {
  id: string;
  gameType: 'maze' | 'emotion' | 'decision' | 'duo';
  userId: string;                     // User who played
  twinId: string;                     // Twin's user ID
  rawData: Record<string, any>;       // Game-specific data (encrypted if sensitive)
  completedAt: Timestamp;
  result?: Record<string, any>;       // Calculated result (when both complete)
  resultCalculatedAt?: Timestamp;
  version: number;                    // For updates
}

/**
 * Invitation Document
 * Collection: invitations/{invitationId}
 */
export interface InvitationDoc {
  id: string;
  code: string;                       // 8-character code
  createdBy: string;                  // User ID
  createdAt: Timestamp;
  expiresAt: Timestamp;               // 7 days from creation
  status: 'pending' | 'accepted' | 'expired';
  acceptedBy?: string;                // User ID who accepted
  acceptedAt?: Timestamp;
}

export type ThemeColor =
  | 'nebula-rose'
  | 'stellar-blue'
  | 'orbit-sage'
  | 'solar-amber'
  | 'celestial-indigo'
  | 'comet-coral'
  | 'aurora-teal'
  | 'meteor-copper';
```

### Firestore Helper Functions

Create `src/services/firebase/firestore.ts`:

```typescript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  type QueryConstraint,
  type Unsubscribe,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase.config';

export class FirestoreService {
  /**
   * Create document in collection
   */
  async createDocument<T extends Record<string, any>>(
    collectionPath: string,
    documentId: string,
    data: T
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionPath, documentId);

      // Add server timestamp for createdAt and updatedAt
      const dataWithTimestamps = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, dataWithTimestamps);
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  /**
   * Update document in collection
   */
  async updateDocument<T extends Record<string, any>>(
    collectionPath: string,
    documentId: string,
    updates: Partial<T>
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionPath, documentId);

      // Add server timestamp for updatedAt
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updatesWithTimestamp);
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  /**
   * Delete document from collection
   */
  async deleteDocument(collectionPath: string, documentId: string): Promise<void> {
    try {
      const docRef = doc(db, collectionPath, documentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Get single document
   */
  async getDocument<T>(collectionPath: string, documentId: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionPath, documentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as T;
      }

      return null;
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  /**
   * Query collection with filters
   */
  async queryCollection<T>(
    collectionPath: string,
    constraints: QueryConstraint[]
  ): Promise<T[]> {
    try {
      const collectionRef = collection(db, collectionPath);
      const q = query(collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => doc.data() as T);
    } catch (error) {
      console.error('Error querying collection:', error);
      throw error;
    }
  }

  /**
   * Real-time listener for single document
   */
  onDocumentSnapshot<T>(
    collectionPath: string,
    documentId: string,
    callback: (data: T | null) => void
  ): Unsubscribe {
    const docRef = doc(db, collectionPath, documentId);

    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as T);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error in document snapshot:', error);
      }
    );
  }

  /**
   * Real-time listener for collection
   */
  onCollectionSnapshot<T>(
    collectionPath: string,
    constraints: QueryConstraint[],
    callback: (data: T[]) => void
  ): Unsubscribe {
    const collectionRef = collection(db, collectionPath);
    const q = query(collectionRef, ...constraints);

    return onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data() as T);
        callback(data);
      },
      (error) => {
        console.error('Error in collection snapshot:', error);
      }
    );
  }

  /**
   * Convert Firestore Timestamp to ISO string
   */
  timestampToISO(timestamp: Timestamp): string {
    return timestamp.toDate().toISOString();
  }

  /**
   * Convert ISO string to Firestore Timestamp
   */
  isoToTimestamp(isoString: string): Timestamp {
    return Timestamp.fromDate(new Date(isoString));
  }
}

// Export singleton instance
export const firestoreService = new FirestoreService();
```

### Collection Path Constants

Create `src/models/firebase/collections.ts`:

```typescript
/**
 * Firestore collection paths
 */
export const COLLECTIONS = {
  USERS: 'users',
  TWIN_PAIRS: 'twinPairs',
  INVITATIONS: 'invitations',
} as const;

/**
 * Subcollection paths within twinPairs
 */
export const SUBCOLLECTIONS = {
  STORIES: 'stories',
  ALERTS: 'alerts',
  GAMES: 'games',
} as const;

/**
 * Helper to build collection paths
 */
export function getUserPath(userId: string): string {
  return `${COLLECTIONS.USERS}/${userId}`;
}

export function getTwinPairPath(pairId: string): string {
  return `${COLLECTIONS.TWIN_PAIRS}/${pairId}`;
}

export function getStoriesPath(pairId: string): string {
  return `${COLLECTIONS.TWIN_PAIRS}/${pairId}/${SUBCOLLECTIONS.STORIES}`;
}

export function getAlertsPath(pairId: string): string {
  return `${COLLECTIONS.TWIN_PAIRS}/${pairId}/${SUBCOLLECTIONS.ALERTS}`;
}

export function getGamesPath(pairId: string): string {
  return `${COLLECTIONS.TWIN_PAIRS}/${pairId}/${SUBCOLLECTIONS.GAMES}`;
}
```

## Dependencies

### Upstream Dependencies
- Story 7.1: Firebase Project Setup and Configuration (must be complete)

### Downstream Dependencies
- Story 7.4: Real-Time Story Synchronization
- Story 7.5: Real-Time Twintuition Alert Delivery
- Story 7.6: Game Results Synchronization

## Files to Create/Modify

### New Files:
- `src/models/firebase/schema.ts` - TypeScript interfaces for all Firestore documents
- `src/models/firebase/collections.ts` - Collection path constants and helpers
- `src/services/firebase/firestore.ts` - Firestore CRUD operations and listeners
- `src/services/firebase/__tests__/firestore.test.ts` - Unit tests for Firestore service

### Modified Files:
- `firestore.rules` - Security rules (from Story 7.1, may need refinement)
- `firestore.indexes.json` - Composite indexes

## Testing Strategy

### Unit Tests
- ✅ UserProfileDoc interface validates correctly
- ✅ TwinPairDoc interface validates correctly
- ✅ StoryDoc includes version field
- ✅ Collection path helpers return correct paths
- ✅ Timestamp conversion functions work correctly
- ✅ FirestoreService creates documents with timestamps
- ✅ FirestoreService updates include updatedAt timestamp

### Integration Tests
- ✅ Can create user document in Firestore
- ✅ Can create twin pair document
- ✅ Can create story in subcollection
- ✅ Can query stories by updatedAt DESC
- ✅ Can query alerts by recipientId and sentAt
- ✅ Security rules prevent cross-pair access
- ✅ Security rules allow twin pair members to access stories
- ✅ Composite indexes exist for required queries

### Manual Testing Checklist
- [ ] Create test documents in each collection via Firebase Console
- [ ] Verify schema matches TypeScript interfaces
- [ ] Test security rules with different users
- [ ] Verify indexes are created in Firestore Console
- [ ] Test real-time listeners update correctly
- [ ] Verify timestamps are server timestamps (not client)

## Definition of Done

- [ ] All acceptance criteria met and verified
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Manual testing checklist completed
- [ ] TypeScript interfaces match Firestore schema
- [ ] Security rules tested with different users
- [ ] Indexes created and verified
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Sprint status updated to "done"

## Risk & Mitigation

**Risk**: Document size exceeds Firestore 1MB limit
- **Mitigation**: Implement pagination for large collections, compress data, use subcollections

**Risk**: Composite indexes not created, queries fail
- **Mitigation**: Deploy indexes via `firestore.indexes.json`, verify in console

**Risk**: Security rules misconfigured, data leaks between twin pairs
- **Mitigation**: Write comprehensive security tests, manual testing with multiple users

## Notes for Implementation

1. **Use server timestamps**: Always use `serverTimestamp()` for consistency across clients
2. **Version fields**: Essential for conflict resolution in stories and games
3. **Soft deletes**: Use `isDeleted` flag instead of hard deletes for recovery
4. **Subcollections**: Use subcollections for stories/alerts/games to isolate twin pair data
5. **Index creation**: Deploy indexes before enabling queries in app

---

**Related Documentation**:
- [Epic 7 Tech Spec](/docs/tech-spec-epic-7.md)
- [Firestore Data Model Best Practices](https://firebase.google.com/docs/firestore/best-practices)

**Story Owner**: Backend Team
**Last Updated**: 2025-11-18
