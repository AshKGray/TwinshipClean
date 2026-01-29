# Epic Technical Specification: Data Synchronization & Backend

Date: 2025-11-18
Author: Claude (BMAD Method)
Epic ID: 7
Status: Draft

---

## Overview

Epic 7 establishes the critical backend infrastructure that transforms Twinship from a local-only app into a real-time, synchronized platform for twins. This epic implements Firebase integration for authentication, Firestore for data persistence, real-time synchronization of stories, Twintuition alerts, and game results, along with offline support and end-to-end encryption for sensitive content.

This specification covers the backend integration layer, authentication system, data models, real-time synchronization strategies, offline queue management, and encryption services. The epic consists of 8 stories that build the foundation for all real-time collaboration features while maintaining a privacy-first, offline-capable architecture.

## Objectives and Scope

**In Scope:**
- Firebase project setup and SDK integration
- Email/password authentication with Firebase Auth
- Firestore database schema and security rules
- Real-time story synchronization with conflict resolution
- Real-time Twintuition alert delivery system
- Game results synchronization and comparison
- Offline queue with automatic sync when online
- End-to-end encryption for sensitive user data
- Local-first architecture with AsyncStorage fallback

**Out of Scope:**
- Social authentication (Google, Apple Sign-In) (Phase 2)
- Firebase Cloud Functions for server-side logic (Phase 2)
- Push notifications via Firebase Cloud Messaging (Phase 2)
- Firebase Storage for media files (will use Firestore for now)
- Advanced conflict resolution (CRDT) (Phase 2)
- Firebase Analytics integration (separate analytics epic)
- Multi-device user sessions
- Backend admin panel

**Success Criteria:**
- Real-time sync latency < 500ms for Twintuition alerts
- Offline queue successfully syncs 100% of queued operations
- Data conflicts resolved without user intervention in 95% of cases
- Authentication flow completes in < 3 seconds
- All sensitive data encrypted before transmission
- App functions fully offline with graceful sync when online
- Security rules prevent unauthorized data access

## System Architecture Alignment

**React Native Mobile App Architecture:**

This epic integrates with the existing Twinship mobile architecture as follows:

1. **Services Layer** (`src/services/firebase/`):
   - `index.ts`: Firebase initialization and configuration
   - `auth.ts`: Authentication service (sign up, sign in, sign out)
   - `firestore.ts`: Firestore database operations
   - `storiesSync.ts`: Real-time story synchronization
   - `twintuitionSync.ts`: Real-time alert synchronization
   - `gamesSync.ts`: Game results synchronization
   - `offlineQueue.ts`: Offline operation queue management
   - `encryption.ts`: End-to-end encryption utilities

2. **State Management** (`src/state/`):
   - `authStore.ts`: Authentication state (NEW)
   - `syncStore.ts`: Sync status and queue state (NEW)
   - Existing stores enhanced with Firebase listeners

3. **Data Models** (`src/models/firebase/`):
   - Firestore collection schemas
   - Security rules definitions
   - Type definitions for Firebase documents

4. **Configuration**:
   - `firebase.config.ts`: Firebase project configuration
   - Environment variables for API keys

**Design System Integration:**
- Sync status indicators in app header (syncing, synced, offline)
- Error toast notifications for sync failures
- Loading states during authentication
- Offline banner when network unavailable

**Existing Patterns:**
- Extends existing AsyncStorage persistence
- Integrates with Zustand stores via middleware
- Follows established error handling patterns
- Maintains offline-first approach

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Inputs | Outputs | Owner |
|----------------|---------------|--------|---------|-------|
| `firebase/index.ts` | Initialize Firebase SDK, configure app | Firebase config | Firebase app instance | Story 7.1 |
| `firebase/auth.ts` | User authentication operations | Email, password | Auth state, user tokens | Story 7.2 |
| `firebase/firestore.ts` | Firestore CRUD operations | Document data, collection paths | Document snapshots | Story 7.3 |
| `firebase/storiesSync.ts` | Real-time story synchronization | Story data, listeners | Synced stories | Story 7.4 |
| `firebase/twintuitionSync.ts` | Real-time alert delivery | Alert data, listeners | Synced alerts | Story 7.5 |
| `firebase/gamesSync.ts` | Game results synchronization | Game session data | Synced results | Story 7.6 |
| `firebase/offlineQueue.ts` | Queue management for offline operations | Queued operations | Sync status | Story 7.7 |
| `firebase/encryption.ts` | Encrypt/decrypt sensitive data | Plain text, encryption keys | Encrypted data | Story 7.8 |
| `authStore.ts` | Authentication state management | Auth actions | Auth state | Story 7.2 |
| `syncStore.ts` | Sync status tracking | Sync events | Sync state, queue | Story 7.7 |

**Module Dependencies:**
- All services depend on `@react-native-firebase/app` or Firebase Web SDK
- Encryption depends on `expo-crypto` or `crypto-js`
- Offline queue depends on `@react-native-community/netinfo`
- All Firebase services depend on Firebase SDK v10+

### Data Models and Contracts

**Firestore Collection Structure:**
```typescript
// Root collections
users/{userId}                    // User profiles
twinPairs/{pairId}               // Twin pair connections
  └─ stories/{storyId}           // Subcollection: Shared stories
  └─ alerts/{alertId}            // Subcollection: Twintuition alerts
  └─ games/{gameId}              // Subcollection: Game sessions

invitations/{invitationId}       // Invitation codes (for pairing)

// Document schemas defined below
```

**UserProfile Document (Firestore):**
```typescript
// Collection: users/{userId}
interface UserProfileDoc {
  id: string;                      // Firebase Auth UID
  email: string;                   // User email (Firebase Auth)
  name: string;                    // Encrypted with user key
  birthdate: string;               // Encrypted
  twinType: 'identical' | 'fraternal' | 'other';
  accentColor: ThemeColor;
  twinId?: string;                 // Reference to twin's user ID
  twinPairId?: string;             // Reference to twinPairs document
  createdAt: Timestamp;            // Firestore Timestamp
  updatedAt: Timestamp;
  encryptionKeyHash?: string;      // Hash for key verification
}
```

**TwinPair Document:**
```typescript
// Collection: twinPairs/{pairId}
interface TwinPairDoc {
  id: string;                      // UUID v4
  twin1Id: string;                 // User ID
  twin2Id: string;                 // User ID
  pairedAt: Timestamp;
  invitationId: string;            // Reference
  sharedEncryptionKey?: string;    // Encrypted with both user keys
}
```

**Story Document (Firestore):**
```typescript
// Collection: twinPairs/{pairId}/stories/{storyId}
interface StoryDoc {
  id: string;
  title: string;                   // Encrypted
  content: string;                 // Encrypted
  createdBy: string;               // User ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;               // User ID of last editor
  mediaUrls?: string[];            // Encrypted URLs (Phase 2: Firebase Storage)
  tags?: string[];
  version: number;                 // For conflict resolution
  editHistory?: EditEntry[];       // Track who edited when
}

interface EditEntry {
  userId: string;
  timestamp: Timestamp;
  changes: string;                 // Summary of changes
}
```

**TwintuitionAlert Document:**
```typescript
// Collection: twinPairs/{pairId}/alerts/{alertId}
interface TwintuitionAlertDoc {
  id: string;
  type: 'feeling' | 'thought' | 'action';
  emotion?: EmotionWord;
  intensity?: number;              // 1-10
  message?: string;                // Encrypted (max 100 chars)
  senderId: string;                // User ID who sent
  recipientId: string;             // User ID who receives
  sentAt: Timestamp;
  seenAt?: Timestamp;
  respondedAt?: Timestamp;
  expiresAt: Timestamp;            // Auto-delete after 24 hours
}
```

**GameSession Document:**
```typescript
// Collection: twinPairs/{pairId}/games/{gameId}
interface GameSessionDoc {
  id: string;
  gameType: 'maze' | 'emotion' | 'decision' | 'duo';
  userId: string;                  // User who played
  twinId: string;                  // Twin's user ID
  rawData: any;                    // Game-specific data (encrypted if sensitive)
  completedAt: Timestamp;
  result?: any;                    // Calculated result (when both complete)
  resultCalculatedAt?: Timestamp;
  version: number;
}
```

**Offline Queue Item:**
```typescript
interface OfflineQueueItem {
  id: string;                      // UUID for queue item
  operation: 'create' | 'update' | 'delete';
  collection: string;              // Firestore collection path
  documentId: string;
  data: any;                       // Data to sync
  timestamp: number;               // When queued
  retryCount: number;              // Number of retry attempts
  maxRetries: number;              // Maximum retries before giving up
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;                  // Error message if failed
}
```

**Sync State:**
```typescript
interface SyncState {
  status: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncedAt?: number;           // Timestamp
  queuedOperations: OfflineQueueItem[];
  pendingCount: number;
  failedCount: number;
  isOnline: boolean;               // Network status
}
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isTwinPairMember(twinPairId) {
      return isAuthenticated() &&
        exists(/databases/$(database)/documents/twinPairs/$(twinPairId)) &&
        (get(/databases/$(database)/documents/twinPairs/$(twinPairId)).data.twin1Id == request.auth.uid ||
         get(/databases/$(database)/documents/twinPairs/$(twinPairId)).data.twin2Id == request.auth.uid);
    }

    // Users collection
    match /users/{userId} {
      // Users can only read and write their own profile
      allow read, write: if isOwner(userId);
    }

    // Twin pairs collection
    match /twinPairs/{pairId} {
      // Both twins can read the pair document
      allow read: if isTwinPairMember(pairId);

      // Only allow creation during pairing (no updates/deletes)
      allow create: if isAuthenticated();

      // Stories subcollection
      match /stories/{storyId} {
        // Both twins can read, create, update stories
        allow read, create, update: if isTwinPairMember(pairId);
        // Only creator can delete (or both twins in Phase 2)
        allow delete: if isTwinPairMember(pairId);
      }

      // Twintuition alerts subcollection
      match /alerts/{alertId} {
        // Both twins can read alerts
        allow read: if isTwinPairMember(pairId);
        // Only authenticated users can create (sender validation in app)
        allow create: if isAuthenticated();
        // Can update to mark as seen
        allow update: if isTwinPairMember(pairId);
        // Auto-delete handled by Cloud Function in Phase 2
      }

      // Games subcollection
      match /games/{gameId} {
        // Both twins can read and write game results
        allow read, create, update: if isTwinPairMember(pairId);
      }
    }

    // Invitations collection
    match /invitations/{invitationId} {
      // Anyone authenticated can read invitations (to validate codes)
      allow read: if isAuthenticated();
      // Only creator can write
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
    }
  }
}
```

### APIs and Interfaces

**Authentication Service:**

```typescript
// firebase/auth.ts
class FirebaseAuthService {
  async signUp(email: string, password: string, profile: UserProfile): Promise<AuthResult>;
  // Creates Firebase Auth user, creates user document in Firestore

  async signIn(email: string, password: string): Promise<AuthResult>;
  // Signs in user, retrieves profile from Firestore

  async signOut(): Promise<void>;
  // Signs out user, clears local auth state

  async sendPasswordResetEmail(email: string): Promise<void>;
  // Sends password reset email via Firebase Auth

  async updatePassword(newPassword: string): Promise<void>;
  // Updates user password

  getCurrentUser(): FirebaseUser | null;
  // Returns current authenticated user

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): Unsubscribe;
  // Listens to auth state changes
}

interface AuthResult {
  success: boolean;
  user?: FirebaseUser;
  profile?: UserProfile;
  error?: string;
}
```

**Firestore Service:**

```typescript
// firebase/firestore.ts
class FirestoreService {
  async createDocument<T>(collection: string, documentId: string, data: T): Promise<void>;
  // Creates new document in collection

  async updateDocument<T>(collection: string, documentId: string, updates: Partial<T>): Promise<void>;
  // Updates existing document

  async deleteDocument(collection: string, documentId: string): Promise<void>;
  // Deletes document

  async getDocument<T>(collection: string, documentId: string): Promise<T | null>;
  // Retrieves single document

  async queryCollection<T>(
    collection: string,
    filters?: QueryFilter[],
    orderBy?: OrderBy,
    limit?: number
  ): Promise<T[]>;
  // Queries collection with filters

  onDocumentSnapshot<T>(
    collection: string,
    documentId: string,
    callback: (data: T | null) => void
  ): Unsubscribe;
  // Real-time listener for single document

  onCollectionSnapshot<T>(
    collection: string,
    filters?: QueryFilter[],
    callback: (data: T[]) => void
  ): Unsubscribe;
  // Real-time listener for collection
}
```

**Story Sync Service:**

```typescript
// firebase/storiesSync.ts
class StorySyncService {
  async createStory(twinPairId: string, story: Story): Promise<void>;
  // Encrypts and creates story in Firestore

  async updateStory(twinPairId: string, storyId: string, updates: Partial<Story>): Promise<void>;
  // Encrypts and updates story, handles version conflicts

  async deleteStory(twinPairId: string, storyId: string): Promise<void>;
  // Deletes story from Firestore

  subscribeToStories(twinPairId: string, callback: (stories: Story[]) => void): Unsubscribe;
  // Real-time listener for all stories in twin pair

  async syncLocalToFirestore(twinPairId: string): Promise<void>;
  // One-time sync of local AsyncStorage stories to Firestore

  resolveConflict(local: Story, remote: Story): Story;
  // Last-write-wins conflict resolution (version-based)
}
```

**Twintuition Sync Service:**

```typescript
// firebase/twintuitionSync.ts
class TwintuitionSyncService {
  async sendAlert(twinPairId: string, alert: TwintuitionAlert): Promise<void>;
  // Creates alert in Firestore, recipient receives via listener

  subscribeToAlerts(twinPairId: string, userId: string, callback: (alerts: TwintuitionAlert[]) => void): Unsubscribe;
  // Real-time listener for alerts where userId is recipient

  async markAlertAsSeen(twinPairId: string, alertId: string): Promise<void>;
  // Updates seenAt timestamp

  async deleteExpiredAlerts(twinPairId: string): Promise<void>;
  // Deletes alerts older than 24 hours (called on app startup)
}
```

**Game Sync Service:**

```typescript
// firebase/gamesSync.ts
class GameSyncService {
  async uploadGameSession(twinPairId: string, session: GameSession): Promise<void>;
  // Uploads game session after completion

  async getTwinGameSession(twinPairId: string, gameType: string, twinId: string): Promise<GameSession | null>;
  // Retrieves twin's session for comparison

  subscribeToGameResults(twinPairId: string, callback: (sessions: GameSession[]) => void): Unsubscribe;
  // Real-time listener for new game completions

  async calculateAndStoreResult(session1: GameSession, session2: GameSession): Promise<void>;
  // Runs analysis, stores result in both session documents
}
```

**Offline Queue Service:**

```typescript
// firebase/offlineQueue.ts
class OfflineQueueService {
  async enqueue(operation: OfflineQueueItem): Promise<void>;
  // Adds operation to queue (stored in AsyncStorage)

  async processQueue(): Promise<void>;
  // Processes all pending queue items

  async retryFailed(): Promise<void>;
  // Retries failed operations (up to maxRetries)

  onNetworkChange(callback: (isOnline: boolean) => void): void;
  // Listens to network status changes

  async clearQueue(): Promise<void>;
  // Clears all completed items from queue

  getQueueStatus(): QueueStatus;
  // Returns current queue stats
}

interface QueueStatus {
  total: number;
  pending: number;
  completed: number;
  failed: number;
}
```

**Encryption Service:**

```typescript
// firebase/encryption.ts
class EncryptionService {
  async generateKey(): Promise<string>;
  // Generates AES-256 encryption key

  async encrypt(plainText: string, key: string): Promise<string>;
  // Encrypts data with AES-256

  async decrypt(cipherText: string, key: string): Promise<string>;
  // Decrypts data

  async hashKey(key: string): Promise<string>;
  // Hashes key for verification (SHA-256)

  async deriveKeyFromPassword(password: string, salt: string): Promise<string>;
  // Derives encryption key from user password (PBKDF2)
}
```

### Workflows and Sequencing

**Firebase Setup Flow (Story 7.1):**
```
Install Firebase SDK dependencies
  ↓
Create Firebase project in Firebase Console
  ↓
Add iOS and Android apps to project
  ↓
Download google-services.json (Android) and GoogleService-Info.plist (iOS)
  ↓
Configure Firebase in app:
  - Initialize Firebase in App.tsx
  - Configure Firestore
  - Configure Firebase Auth
  ↓
Set up Firestore collections and indexes
  ↓
Deploy security rules to Firebase Console
  ↓
Store Firebase config in environment variables
  ↓
Test connection: Create test document
```

**User Registration with Firebase (Story 7.2):**
```
User enters email, password, profile data
  ↓
Validate input locally
  ↓
Call FirebaseAuthService.signUp()
  ↓
Firebase creates user in Auth
  ↓
Generate encryption key from password
  ↓
Encrypt sensitive profile fields
  ↓
Create user document in Firestore (users/{userId})
  ↓
Save user to authStore
  ↓
Save encryption key to SecureStore
  ↓
Return success → Navigate to app
```

**Sign In Flow:**
```
User enters email, password
  ↓
Call FirebaseAuthService.signIn()
  ↓
Firebase Auth validates credentials
  ↓
Retrieve user document from Firestore
  ↓
Derive encryption key from password
  ↓
Decrypt profile fields
  ↓
Save user to authStore
  ↓
Save encryption key to SecureStore
  ↓
Load twin pair data if exists
  ↓
Start real-time listeners (stories, alerts, games)
  ↓
Return success → Navigate to Home
```

**Story Sync Flow (Story 7.4):**
```
User creates/edits story locally
  ↓
Check network status
  ↓
[If online]:
  ↓
  Encrypt story content
  ↓
  Call StorySyncService.createStory() or updateStory()
  ↓
  Write to Firestore: twinPairs/{pairId}/stories/{storyId}
  ↓
  Twin's app receives update via real-time listener
  ↓
  Decrypt story content
  ↓
  Update local storiesStore
  ↓
  Display updated story
  ↓
[If offline]:
  ↓
  Save to AsyncStorage
  ↓
  Add to offline queue
  ↓
  Show "offline" indicator
  ↓
  When network returns → Process queue → Sync to Firestore
```

**Twintuition Alert Flow (Story 7.5):**
```
User presses Twintuition button
  ↓
User selects emotion, intensity, optional message
  ↓
Create TwintuitionAlert object
  ↓
Encrypt message if present
  ↓
Call TwintuitionSyncService.sendAlert()
  ↓
Write to Firestore: twinPairs/{pairId}/alerts/{alertId}
  ↓
Twin's app receives alert via real-time listener
  ↓
Decrypt message
  ↓
Show in-app notification banner
  ↓
[If app is backgrounded] → Trigger push notification (Phase 2)
  ↓
Update twintuitionStore
  ↓
Twin can mark as seen → Update seenAt in Firestore
```

**Game Results Sync Flow (Story 7.6):**
```
User completes game
  ↓
Save raw game data locally (AsyncStorage)
  ↓
Call GameSyncService.uploadGameSession()
  ↓
Write to Firestore: twinPairs/{pairId}/games/{gameId}
  ↓
Check: Has twin completed this game?
  ↓
[If yes]:
  ↓
  Retrieve twin's session from Firestore
  ↓
  Run analysis algorithm locally
  ↓
  Generate GameResult with insights
  ↓
  Store result in both session documents
  ↓
  Both twins receive result via listener
  ↓
  Navigate to results screen
  ↓
[If no]:
  ↓
  Show "Waiting for twin to complete" message
  ↓
  Listen for twin's session
  ↓
  When twin completes → Trigger analysis → Show results
```

**Offline Queue Processing (Story 7.7):**
```
Network status changes to online
  ↓
OfflineQueueService.onNetworkChange() fires
  ↓
Call processQueue()
  ↓
Retrieve all pending queue items from AsyncStorage
  ↓
For each item:
  ↓
  Update status: pending → syncing
  ↓
  Execute Firestore operation (create/update/delete)
  ↓
  [If success]:
    ↓
    Update status: syncing → completed
    ↓
    Remove from queue
    ↓
  [If error]:
    ↓
    Increment retryCount
    ↓
    [If retryCount < maxRetries]:
      ↓
      Update status: syncing → pending
      ↓
      Retry after exponential backoff
      ↓
    [If retryCount >= maxRetries]:
      ↓
      Update status: syncing → failed
      ↓
      Show error notification to user
      ↓
Update sync status in syncStore
  ↓
Display "Synced" indicator in UI
```

**Conflict Resolution (Story 7.4):**
```
User edits story offline
  ↓
Story version: 5, updatedAt: T1
  ↓
Twin edits same story while user offline
  ↓
Twin's version: 6, updatedAt: T2 (T2 > T1)
  ↓
User comes online, queue processes
  ↓
Attempt to update story with version 5
  ↓
Firestore returns error: Version conflict
  ↓
Retrieve current remote version (version 6)
  ↓
Compare updatedAt timestamps
  ↓
Last-write-wins: Keep version with later timestamp
  ↓
[If remote is newer]:
  ↓
  Discard local changes
  ↓
  Update local with remote version
  ↓
  Notify user: "Story was updated by your twin"
  ↓
[If local is newer (edge case)]:
  ↓
  Overwrite remote with local
  ↓
  Increment version to 7
```

## Non-Functional Requirements

### Performance

**Target Metrics:**
- **Authentication**: < 3 seconds for sign-in/sign-up
- **Real-Time Sync Latency**: < 500ms for Twintuition alerts
- **Story Sync**: < 2 seconds to sync story to twin's device
- **Offline Queue Processing**: < 5 seconds for 10 queued operations
- **Firestore Read**: < 200ms for single document retrieval
- **Firestore Write**: < 300ms for single document write
- **Encryption/Decryption**: < 50ms per operation

**Performance Requirements:**
1. **Efficient Listeners**: Use Firestore real-time listeners only for active data
2. **Pagination**: Load stories/alerts in batches (20 at a time)
3. **Caching**: Cache Firestore reads to reduce billable operations
4. **Batch Writes**: Batch multiple Firestore writes when possible
5. **Lazy Sync**: Defer non-critical syncs until user is idle

**Performance Optimizations:**
- Use Firestore local cache for offline reads
- Debounce rapid updates (e.g., typing in story editor)
- Compress large game result data before upload
- Unsubscribe from listeners when screens unmount
- Use indexes for frequently queried fields

### Security

**Authentication & Authorization:**
- Secure password storage via Firebase Auth (bcrypt hashing)
- Firestore security rules enforce twin-pair isolation
- No cross-pair data access (enforced server-side)
- Session tokens expire after inactivity (Firebase default: 1 hour)

**Data Protection:**
- **End-to-End Encryption**: Stories, messages, personal profile data encrypted with user-derived keys
- **Encryption at Rest**: Firestore automatically encrypts data at rest
- **Encryption in Transit**: All Firebase connections use TLS 1.2+
- **Key Management**: Encryption keys stored in Expo SecureStore (iOS Keychain, Android Keystore)

**Threat Mitigation:**
- **Man-in-the-Middle**: TLS prevents interception
- **Unauthorized Access**: Security rules enforce authentication and twin-pair membership
- **Data Leakage**: Sensitive fields encrypted before storage
- **Brute Force**: Firebase Auth rate limits login attempts

### Reliability/Availability

**Error Handling:**
- Graceful degradation to offline mode if Firestore unavailable
- Retry logic with exponential backoff for failed operations
- Clear error messages for network issues, auth failures, permission errors
- Automatic reconnection when network restored

**Data Persistence:**
- **Offline-First**: All data persists to AsyncStorage before syncing
- **Dual Storage**: Data in both AsyncStorage (offline) and Firestore (online)
- **Queue Durability**: Offline queue persists across app restarts
- **Conflict Resolution**: Last-write-wins strategy with version tracking

**Availability Targets:**
- **Local Operations**: 99.9% availability (only fails if device storage full)
- **Firestore Operations**: 99.95% availability (Firebase SLA)
- **Offline Functionality**: 100% feature availability offline (sync when online)

### Observability

**Logging:**
- **Info**: Successful syncs, auth state changes, queue processing
- **Debug**: Firestore operations, listener events, encryption operations
- **Error**: Sync failures, auth errors, conflict resolutions, queue failures
- **No PII**: Never log unencrypted user data

**Metrics Tracking:**
- **Sync Success Rate**: Percentage of successful syncs vs failures
- **Queue Size**: Number of pending offline operations
- **Sync Latency**: Time from write to twin receiving update
- **Firestore Usage**: Read/write counts for billing monitoring
- **Error Rates**: Auth failures, permission denials, network errors

**Monitoring:**
- Firebase Console for real-time error tracking
- Firestore usage dashboard for cost monitoring
- Network status changes logged
- Queue health metrics (pending, failed, completed)

## Dependencies and Integrations

### NPM Dependencies

**Firebase SDK:**
| Package | Version | Purpose | Epic 7 Usage |
|---------|---------|---------|--------------|
| `@react-native-firebase/app` | 20.5.0+ | Core Firebase SDK | All Firebase operations |
| `@react-native-firebase/auth` | 20.5.0+ | Firebase Authentication | Story 7.2 |
| `@react-native-firebase/firestore` | 20.5.0+ | Firestore database | Stories 7.3-7.6 |

**Alternative: Firebase Web SDK (if using Expo)**
| Package | Version | Purpose | Epic 7 Usage |
|---------|---------|---------|--------------|
| `firebase` | 10.13.0+ | Firebase Web SDK for Expo | All Firebase operations |

**Encryption:**
| Package | Version | Purpose | Epic 7 Usage |
|---------|---------|---------|--------------|
| `expo-crypto` | 14.0.2 | Cryptographic functions | Story 7.8 |
| `crypto-js` | 4.2.0 | AES encryption (fallback) | Story 7.8 |
| `expo-secure-store` | 14.1.2 | Secure key storage | Story 7.8 |

**Network & Offline:**
| Package | Version | Purpose | Epic 7 Usage |
|---------|---------|---------|--------------|
| `@react-native-community/netinfo` | 11.4.1 | Network status detection | Story 7.7 |

**Existing Dependencies:**
- `zustand` (state management)
- `@react-native-async-storage/async-storage` (local persistence)
- `uuid` (ID generation)

### Firebase Project Configuration

**Firebase Console Setup:**
1. Create Firebase project: "Twinship"
2. Enable Authentication → Email/Password provider
3. Enable Firestore Database → Start in production mode
4. Add iOS app (Bundle ID from app.json)
5. Add Android app (Package name from app.json)
6. Download config files (GoogleService-Info.plist, google-services.json)
7. Deploy security rules from `/firestore.rules`
8. Create composite indexes for queries

**Firestore Indexes Required:**
```javascript
// twinPairs/{pairId}/stories
// Index: (updatedAt, DESC)

// twinPairs/{pairId}/alerts
// Index: (recipientId, ASC), (sentAt, DESC)

// twinPairs/{pairId}/games
// Index: (gameType, ASC), (completedAt, DESC)
```

**Environment Variables:**
```bash
# .env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id (optional)
```

### External Integrations

**Firebase Services Used:**
- Firebase Authentication (Email/Password)
- Cloud Firestore (NoSQL database)
- Firebase Security Rules

**Future Integrations (Phase 2):**
- Firebase Cloud Functions (server-side logic)
- Firebase Cloud Messaging (push notifications)
- Firebase Storage (media uploads)
- Firebase Performance Monitoring

### Internal Module Dependencies

**Epic 7 depends on:**
- **Epic 1**: User profiles and twin pairing data to sync
- Existing AsyncStorage persistence layer
- Existing Zustand stores for state management

**Epic 7 enables:**
- **Epic 3** (Twintuition): Real-time alert delivery
- **Epic 4** (Twincidences): Real-time story synchronization
- **Epic 2** (Games): Game results comparison when both twins complete
- **Epic 5** (Research): Backend for data submission

## Acceptance Criteria (Authoritative)

### AC-7.1: Firebase Project Setup and Configuration
1. Firebase project created in Firebase Console
2. Firebase SDK installed and configured in app
3. Firestore database initialized
4. Firebase Authentication enabled
5. Security rules deployed and active
6. iOS and Android apps registered in Firebase project
7. Config files (GoogleService-Info.plist, google-services.json) added to project
8. Test connection successful: Can create/read test document
9. Environment variables configured for API keys

### AC-7.2: User Authentication with Firebase
1. User can sign up with email and password
2. Email validation enforced (valid format)
3. Password requirements enforced (min 8 characters)
4. User document created in Firestore upon sign-up
5. User can sign in with valid credentials
6. Invalid credentials show clear error message
7. Password reset email can be sent
8. Auth state persists across app restarts
9. User can sign out successfully
10. Auth state synced with authStore

### AC-7.3: Firestore Data Models and Schema
1. Users collection created with correct schema
2. TwinPairs collection created
3. Stories subcollection structure defined
4. Alerts subcollection structure defined
5. Games subcollection structure defined
6. Security rules enforce twin-pair isolation
7. Security rules prevent unauthorized access
8. Composite indexes created for queries
9. Version field included for conflict detection
10. Timestamps use Firestore Timestamp type

### AC-7.4: Real-Time Story Synchronization
1. Creating story locally syncs to Firestore
2. Twin receives story update in real-time (< 2s)
3. Editing story syncs changes to twin's device
4. Deleting story syncs to twin's device
5. Conflict resolution uses last-write-wins strategy
6. Version numbers increment on each update
7. Stories encrypted before upload
8. Stories decrypted when retrieved
9. Offline stories queue for sync when online
10. Firestore listener updates local storiesStore

### AC-7.5: Real-Time Twintuition Alert Delivery
1. Sending alert writes to Firestore
2. Twin receives alert in real-time (< 500ms)
3. In-app notification banner displays for incoming alert
4. Alert message encrypted if present
5. Alerts auto-delete after 24 hours
6. Mark as seen updates seenAt timestamp
7. Alert history loads from Firestore
8. Offline alerts queue for sync
9. Listener updates twintuitionStore
10. Expired alerts cleaned up on app startup

### AC-7.6: Game Results Synchronization
1. Completed game session uploads to Firestore
2. Twin's game session retrieved for comparison
3. Analysis runs when both twins complete game
4. Result stored in both session documents
5. Both twins notified when result available
6. Results load from Firestore on app startup
7. Large game data compressed before upload
8. Offline game sessions queue for sync
9. Real-time listener for twin completing games
10. Results display with twin comparison data

### AC-7.7: Offline Support and Sync Queue
1. Network status detected accurately
2. Offline operations queue to AsyncStorage
3. Queued operations process when online
4. Failed operations retry with exponential backoff
5. Max retries enforced (default: 3)
6. Sync status indicator shows current state (syncing, synced, offline)
7. User notified of sync failures
8. Queue persists across app restarts
9. Completed operations removed from queue
10. Queue health metrics available in syncStore

### AC-7.8: Data Encryption for Sensitive Content
1. Stories encrypted before Firestore upload
2. Alert messages encrypted if present
3. User profile names and birthdates encrypted
4. Encryption uses AES-256 algorithm
5. Encryption keys derived from user password
6. Keys stored securely in Expo SecureStore
7. Decryption successful on retrieval
8. Key hash stored for verification
9. Twin pair shared key for collaborative content
10. Encryption/decryption transparent to user

### AC-7.9: Cross-Cutting Requirements
1. All Firestore operations handle errors gracefully
2. Network errors show user-friendly messages
3. Authentication errors show clear guidance
4. Permission denials logged and reported
5. All sensitive data encrypted end-to-end
6. Security rules prevent cross-pair access
7. App functions fully offline
8. Sync completes within 5 seconds for typical queue
9. Firebase usage monitored for cost control
10. Real-time listeners unsubscribe on unmount

## Traceability Mapping

| Acceptance Criteria | Tech Spec Section(s) | Component(s)/API(s) | Test Strategy |
|---------------------|---------------------|---------------------|---------------|
| **AC-7.1: Firebase Setup** | | | |
| AC-7.1.1: Project created | External Integrations | Firebase Console | Manual: Verify project exists |
| AC-7.1.2: SDK installed | Dependencies | package.json, firebase/index.ts | Unit test: Import Firebase |
| AC-7.1.3: Firestore initialized | Services: firestore.ts | FirestoreService | Integration test: Write test doc |
| AC-7.1.4: Auth enabled | Services: auth.ts | FirebaseAuthService | Integration test: Create test user |
| AC-7.1.5: Security rules deployed | Data Models: Security Rules | Firestore Console | Manual: Test unauthorized access |
| AC-7.1.6: Apps registered | External Integrations | Firebase Console | Manual: Verify iOS/Android apps |
| AC-7.1.7: Config files added | Configuration | GoogleService-Info.plist, google-services.json | Build test: App builds successfully |
| AC-7.1.8: Test connection | Services: firestore.ts | createDocument(), getDocument() | Integration test: Create/read test doc |
| AC-7.1.9: Environment variables | Configuration | .env, firebase.config.ts | Unit test: Config loads correctly |
| **AC-7.2: Authentication** | | | |
| AC-7.2.1: Sign up | Services: auth.ts | signUp() | E2E test: Create new user |
| AC-7.2.2: Email validation | Services: auth.ts | Email regex | Unit test: Invalid emails rejected |
| AC-7.2.3: Password requirements | Services: auth.ts | Password validation | Unit test: Weak passwords rejected |
| AC-7.2.4: User document created | Services: auth.ts, firestore.ts | createDocument() | Integration test: Doc in Firestore |
| AC-7.2.5: Sign in | Services: auth.ts | signIn() | E2E test: Sign in with valid creds |
| AC-7.2.6: Invalid credentials | Services: auth.ts | Error handling | E2E test: Invalid creds show error |
| AC-7.2.7: Password reset | Services: auth.ts | sendPasswordResetEmail() | Integration test: Email sent |
| AC-7.2.8: Auth persistence | State: authStore.ts | AsyncStorage persist | Integration test: Auth survives restart |
| AC-7.2.9: Sign out | Services: auth.ts | signOut() | E2E test: User signed out |
| AC-7.2.10: Auth state synced | State: authStore.ts | onAuthStateChanged() | Integration test: Store updates |
| **AC-7.3: Data Models** | | | |
| AC-7.3.1-5: Collections created | Data Models | Firestore schema | Manual: Verify in Console |
| AC-7.3.6-7: Security rules | Data Models: Security Rules | isTwinPairMember() | Integration test: Unauthorized access denied |
| AC-7.3.8: Indexes created | External Integrations | Firestore indexes | Manual: Verify in Console |
| AC-7.3.9: Version field | Data Models: StoryDoc | version number | Unit test: Version increments |
| AC-7.3.10: Timestamps | Data Models | Firestore Timestamp | Unit test: Timestamp type correct |
| **AC-7.4: Story Sync** | | | |
| AC-7.4.1: Create syncs | Services: storiesSync.ts | createStory() | Integration test: Story in Firestore |
| AC-7.4.2: Real-time receive | Services: storiesSync.ts | subscribeToStories() | E2E test: Twin sees update < 2s |
| AC-7.4.3: Edit syncs | Services: storiesSync.ts | updateStory() | Integration test: Edit syncs |
| AC-7.4.4: Delete syncs | Services: storiesSync.ts | deleteStory() | Integration test: Delete syncs |
| AC-7.4.5: Conflict resolution | Services: storiesSync.ts | resolveConflict() | Unit test: Last-write-wins |
| AC-7.4.6: Version increment | Services: storiesSync.ts | version field | Unit test: Version increments |
| AC-7.4.7: Encryption before upload | Services: encryption.ts | encrypt() | Unit test: Story encrypted |
| AC-7.4.8: Decryption on retrieval | Services: encryption.ts | decrypt() | Unit test: Story decrypted |
| AC-7.4.9: Offline queue | Services: offlineQueue.ts | enqueue() | Integration test: Story queued |
| AC-7.4.10: Listener updates store | State: storiesStore | subscribeToStories() callback | Integration test: Store updated |
| **AC-7.5: Twintuition Sync** | | | |
| AC-7.5.1: Send alert | Services: twintuitionSync.ts | sendAlert() | Integration test: Alert in Firestore |
| AC-7.5.2: Real-time receive | Services: twintuitionSync.ts | subscribeToAlerts() | E2E test: Twin receives < 500ms |
| AC-7.5.3: In-app notification | UI: TwintuitionNotification | subscribeToAlerts() callback | Integration test: Banner displays |
| AC-7.5.4: Message encrypted | Services: encryption.ts | encrypt() | Unit test: Message encrypted |
| AC-7.5.5: Auto-delete after 24h | Services: twintuitionSync.ts | deleteExpiredAlerts() | Unit test: Expired alerts deleted |
| AC-7.5.6: Mark as seen | Services: twintuitionSync.ts | markAlertAsSeen() | Integration test: seenAt updated |
| AC-7.5.7: Alert history | Services: twintuitionSync.ts | subscribeToAlerts() | Integration test: History loads |
| AC-7.5.8: Offline queue | Services: offlineQueue.ts | enqueue() | Integration test: Alert queued |
| AC-7.5.9: Listener updates store | State: twintuitionStore | subscribeToAlerts() callback | Integration test: Store updated |
| AC-7.5.10: Cleanup on startup | Services: twintuitionSync.ts | deleteExpiredAlerts() | Integration test: Cleanup runs |
| **AC-7.6: Game Sync** | | | |
| AC-7.6.1: Upload session | Services: gamesSync.ts | uploadGameSession() | Integration test: Session in Firestore |
| AC-7.6.2: Retrieve twin session | Services: gamesSync.ts | getTwinGameSession() | Integration test: Session retrieved |
| AC-7.6.3: Analysis runs | Services: gamesSync.ts | calculateAndStoreResult() | Unit test: Result calculated |
| AC-7.6.4: Result stored | Services: gamesSync.ts | updateDocument() | Integration test: Result in both docs |
| AC-7.6.5: Both notified | Services: gamesSync.ts | subscribeToGameResults() | E2E test: Both twins see result |
| AC-7.6.6: Results load on startup | Services: gamesSync.ts | queryCollection() | Integration test: Results load |
| AC-7.6.7: Data compressed | Services: gamesSync.ts | JSON.stringify() | Unit test: Data size reduced |
| AC-7.6.8: Offline queue | Services: offlineQueue.ts | enqueue() | Integration test: Session queued |
| AC-7.6.9: Real-time listener | Services: gamesSync.ts | subscribeToGameResults() | Integration test: Listener fires |
| AC-7.6.10: Results display | UI: GameResults | GameResult data | E2E test: Comparison data shown |
| **AC-7.7: Offline Support** | | | |
| AC-7.7.1: Network detection | Services: offlineQueue.ts | NetInfo.addEventListener() | Unit test: Status changes detected |
| AC-7.7.2: Queue to AsyncStorage | Services: offlineQueue.ts | enqueue() | Integration test: Queue persists |
| AC-7.7.3: Process when online | Services: offlineQueue.ts | processQueue() | E2E test: Queue syncs |
| AC-7.7.4: Retry with backoff | Services: offlineQueue.ts | retryFailed() | Unit test: Exponential backoff |
| AC-7.7.5: Max retries enforced | Services: offlineQueue.ts | maxRetries check | Unit test: Stops after 3 retries |
| AC-7.7.6: Sync status indicator | UI: SyncStatusIndicator | syncStore.status | UI test: Indicator displays |
| AC-7.7.7: Failure notification | UI: ErrorToast | syncStore.failedCount | Integration test: Toast shows |
| AC-7.7.8: Queue persists restart | Services: offlineQueue.ts | AsyncStorage | Integration test: Queue survives restart |
| AC-7.7.9: Completed removed | Services: offlineQueue.ts | clearQueue() | Unit test: Completed items cleared |
| AC-7.7.10: Queue metrics | State: syncStore | getQueueStatus() | Unit test: Metrics accurate |
| **AC-7.8: Encryption** | | | |
| AC-7.8.1: Stories encrypted | Services: encryption.ts | encrypt() | Unit test: Ciphertext returned |
| AC-7.8.2: Messages encrypted | Services: encryption.ts | encrypt() | Unit test: Message encrypted |
| AC-7.8.3: Profile fields encrypted | Services: encryption.ts | encrypt() | Unit test: Fields encrypted |
| AC-7.8.4: AES-256 algorithm | Services: encryption.ts | crypto-js AES | Unit test: Algorithm correct |
| AC-7.8.5: Key derivation | Services: encryption.ts | deriveKeyFromPassword() | Unit test: Key derived |
| AC-7.8.6: Secure key storage | Services: encryption.ts | SecureStore.setItemAsync() | Integration test: Key in SecureStore |
| AC-7.8.7: Decryption successful | Services: encryption.ts | decrypt() | Unit test: Plaintext returned |
| AC-7.8.8: Key hash verification | Services: encryption.ts | hashKey() | Unit test: Hash matches |
| AC-7.8.9: Shared twin key | Services: encryption.ts | generateKey() | Unit test: Key shared |
| AC-7.8.10: Transparent to user | All screens | encrypt/decrypt in services | E2E test: User sees plaintext |
| **AC-7.9: Cross-Cutting** | | | |
| AC-7.9.1: Error handling | All services | Try-catch blocks | Unit test: Errors caught |
| AC-7.9.2: Network error messages | UI: ErrorToast | Error handling | UI test: Message shows |
| AC-7.9.3: Auth error messages | UI: ErrorToast | auth.ts errors | UI test: Message shows |
| AC-7.9.4: Permission denials logged | Services: firestore.ts | Error logging | Integration test: Error logged |
| AC-7.9.5: End-to-end encryption | Services: encryption.ts | All sensitive data | Integration test: Data encrypted |
| AC-7.9.6: Security rules enforced | Data Models: Security Rules | Firestore rules | Integration test: Access denied |
| AC-7.9.7: Offline functionality | All features | AsyncStorage fallback | E2E test: App works offline |
| AC-7.9.8: Sync completes quickly | Services: offlineQueue.ts | processQueue() | Performance test: < 5s for 10 items |
| AC-7.9.9: Usage monitored | Observability | Firebase Console | Manual: Check dashboard |
| AC-7.9.10: Listeners unsubscribe | All services | useEffect cleanup | Unit test: Unsubscribe called |

## Risks, Assumptions, Open Questions

### Risks

| Risk ID | Description | Probability | Impact | Mitigation Strategy | Owner |
|---------|-------------|-------------|--------|---------------------|-------|
| R-7.1 | Firebase costs exceed budget due to excessive reads/writes | Medium | High | Implement caching, batch operations, monitor usage dashboard | Story 7.3 |
| R-7.2 | Security rules misconfigured, allowing unauthorized access | Low | Critical | Thorough testing of rules, penetration testing, code review | Story 7.3 |
| R-7.3 | Offline queue grows too large, exhausts device storage | Low | Medium | Set max queue size, oldest items expire, compress data | Story 7.7 |
| R-7.4 | Conflict resolution loses user data (both twins edit simultaneously) | Medium | High | Implement version tracking, notify users of conflicts, allow manual merge in Phase 2 | Story 7.4 |
| R-7.5 | Encryption keys lost if user forgets password | High | Medium | Implement key recovery mechanism, warn users about data loss | Story 7.8 |
| R-7.6 | Real-time listeners cause battery drain | Medium | Medium | Unsubscribe when screens unmount, use efficient queries | All stories |
| R-7.7 | Firebase SDK conflicts with Expo managed workflow | Low | High | Use Firebase Web SDK for Expo, test thoroughly on both platforms | Story 7.1 |
| R-7.8 | Network instability causes sync failures and user frustration | Medium | Medium | Robust retry logic, clear sync status indicators, offline-first design | Story 7.7 |

### Assumptions

| Assumption ID | Description | Validation Method | Impact if Invalid |
|---------------|-------------|-------------------|-------------------|
| A-7.1 | Users have stable internet connection for real-time sync | User testing, analytics | Offline queue must handle extended offline periods |
| A-7.2 | Firestore pricing remains within acceptable range | Cost monitoring | May need to migrate to alternative backend |
| A-7.3 | AES-256 encryption is sufficient for user data | Security audit | May need stronger encryption or additional layers |
| A-7.4 | Last-write-wins conflict resolution acceptable to users | User testing | May need more sophisticated merge strategies |
| A-7.5 | Users trust Firebase for data storage | User research, privacy policy | May need to offer self-hosted option |
| A-7.6 | Firestore security rules correctly enforce twin-pair isolation | Penetration testing | Could allow unauthorized data access |
| A-7.7 | Expo SecureStore is reliable for encryption key storage | Security review | Keys could be lost or compromised |
| A-7.8 | Firebase Web SDK performs adequately on mobile | Performance testing | May need native SDK despite Expo limitations |

### Open Questions

| Question ID | Description | Importance | Resolution Needed By | Proposed Resolution |
|-------------|-------------|------------|---------------------|---------------------|
| Q-7.1 | Should we use Firebase Web SDK or React Native Firebase? | High | Story 7.1 | **Decision**: Use Firebase Web SDK for Expo compatibility, accept minor performance trade-off |
| Q-7.2 | How to handle encryption key recovery if user forgets password? | High | Story 7.8 | **Decision**: No recovery possible (security > convenience), warn users prominently |
| Q-7.3 | What's the max offline queue size before rejecting new operations? | Medium | Story 7.7 | **Decision**: 100 items max, oldest expire first |
| Q-7.4 | Should we implement operational transformation for conflict resolution? | Low | Phase 2 | **Decision**: Last-write-wins for MVP, OT in Phase 2 if needed |
| Q-7.5 | How to notify users of sync conflicts? | Medium | Story 7.4 | **Decision**: Toast notification, conflict log in settings |
| Q-7.6 | Should encryption be optional for performance-sensitive users? | Low | Story 7.8 | **Decision**: No, encryption mandatory for all sensitive data |
| Q-7.7 | What's the data retention policy for deleted stories/alerts? | Medium | Story 7.4 | **Decision**: Soft delete for 30 days, then permanent delete |
| Q-7.8 | How to handle Firestore quota limits (reads, writes per day)? | Medium | Story 7.3 | **Decision**: Monitor usage, implement rate limiting if needed |

### Technical Debt

| Item | Description | Impact | Remediation Plan |
|------|-------------|--------|------------------|
| TD-7.1 | No push notifications (only in-app for now) | Medium | Add Firebase Cloud Messaging in Phase 2 |
| TD-7.2 | No media upload to Firebase Storage | Low | Implement Firebase Storage for photos/videos in Phase 2 |
| TD-7.3 | Simple last-write-wins conflict resolution | Medium | Implement CRDT or OT in Phase 2 for advanced merging |
| TD-7.4 | No server-side validation (only client + security rules) | Low | Add Cloud Functions for complex validation in Phase 2 |
| TD-7.5 | No analytics for Firestore usage optimization | Low | Integrate Firebase Analytics and Performance Monitoring |

## Test Strategy Summary

### Unit Tests

**Target Coverage**: 80% minimum

**Key Test Areas:**
1. **Authentication Service** (Story 7.2):
   - Sign up: Valid inputs, invalid email, weak password
   - Sign in: Valid credentials, invalid credentials, network errors
   - Password reset: Valid email, invalid email
   - Auth state persistence

2. **Firestore Service** (Story 7.3):
   - CRUD operations: Create, read, update, delete documents
   - Query operations: Filters, ordering, pagination
   - Real-time listeners: Snapshot updates, listener cleanup
   - Error handling: Permission errors, network errors

3. **Story Sync Service** (Story 7.4):
   - Create story: Encryption, Firestore write
   - Update story: Version increment, conflict detection
   - Delete story: Firestore delete, local removal
   - Conflict resolution: Last-write-wins logic
   - Real-time subscription: Callback fires on update

4. **Twintuition Sync Service** (Story 7.5):
   - Send alert: Encryption, Firestore write
   - Subscribe to alerts: Real-time updates, callback fires
   - Mark as seen: seenAt timestamp update
   - Delete expired: Alerts older than 24 hours removed

5. **Game Sync Service** (Story 7.6):
   - Upload session: Data compression, Firestore write
   - Retrieve twin session: Correct session returned
   - Calculate result: Analysis runs, result stored
   - Real-time listener: Callback fires when twin completes

6. **Offline Queue Service** (Story 7.7):
   - Enqueue operation: Item added to queue, persisted to AsyncStorage
   - Process queue: All pending items processed
   - Retry failed: Exponential backoff, max retries enforced
   - Network detection: Status changes detected

7. **Encryption Service** (Story 7.8):
   - Generate key: Random key generated, correct length
   - Encrypt: Ciphertext returned, cannot read without key
   - Decrypt: Plaintext returned, matches original
   - Key derivation: Consistent key from password
   - Hash key: Correct hash for verification

### Integration Tests

**Target**: All service interactions

**Key Integration Scenarios:**
1. **Complete Auth Flow** (Story 7.2):
   - Sign up → User document created in Firestore → Auth state saved
   - Sign in → Profile retrieved → Encryption key derived → Auth state updated
   - Sign out → Auth state cleared → Listeners unsubscribed

2. **Story Sync Flow** (Story 7.4):
   - Create story locally → Encrypt → Write to Firestore → Twin receives via listener → Decrypt → Update store
   - Verify both AsyncStorage and Firestore contain story

3. **Twintuition Alert Flow** (Story 7.5):
   - Send alert → Encrypt message → Write to Firestore → Twin receives < 500ms → Display notification
   - Mark as seen → Update Firestore → Verify seenAt timestamp

4. **Game Results Sync** (Story 7.6):
   - Upload session → Wait for twin → Retrieve twin session → Run analysis → Store result → Both twins notified
   - Verify result in both session documents

5. **Offline to Online Sync** (Story 7.7):
   - Go offline → Create story → Queue operation → Go online → Process queue → Story synced → Queue cleared
   - Verify story in Firestore after sync

6. **Conflict Resolution** (Story 7.4):
   - Twin 1 edits story offline → Twin 2 edits same story → Twin 1 comes online → Conflict detected → Last-write-wins → Loser notified
   - Verify correct version in Firestore

### E2E Tests

**Target**: Critical user journeys

**Testing Tool**: Detox or Maestro

**Key E2E Scenarios:**
1. **Happy Path - Sign Up and Sync**:
   - Sign up → Create story → Twin signs up → Twin sees story in real-time
   - Expected: Story appears on twin's device < 2 seconds

2. **Happy Path - Twintuition Alert**:
   - Send Twintuition alert → Twin receives notification banner → Twin marks as seen
   - Expected: Alert delivered < 500ms, seenAt updated

3. **Happy Path - Game Results**:
   - Complete game → Twin completes same game → Both see results
   - Expected: Results calculated and displayed

4. **Error Path - Offline Queue**:
   - Go offline → Create story → Edit story → Go online → Stories sync
   - Expected: All queued operations complete, stories synced

5. **Error Path - Invalid Credentials**:
   - Attempt sign in with wrong password → Error message displayed
   - Expected: Clear error, can retry

6. **Recovery Path - App Restart**:
   - Sign in → Create story → Kill app → Restart → Sign in → Story still present
   - Expected: Data persists, auth state restored

### Performance Tests

**Target Metrics:**
- Authentication: < 3 seconds
- Real-time sync latency: < 500ms
- Offline queue processing: < 5 seconds for 10 items
- Encryption/decryption: < 50ms

**Key Performance Tests:**
1. Real-time listener latency (story update to twin receiving)
2. Offline queue processing speed (bulk operations)
3. Encryption overhead (encrypt/decrypt large story)
4. Firestore query performance (load 50 stories)
5. Network change detection speed

### Security Tests

**Key Security Tests:**
1. Unauthorized access: Attempt to read twin pair data from different user
2. Firestore security rules: Test all rule conditions
3. Encryption strength: Verify AES-256, key length
4. Man-in-the-middle: Verify TLS 1.2+ enforced
5. Key storage: Verify keys in SecureStore (not AsyncStorage)
6. Data leakage: Verify no PII in logs or crash reports

### Regression Test Suite

**Automated regression tests run on every PR:**
1. All unit tests
2. Critical integration tests
3. Core E2E happy paths
4. Security tests (unauthorized access, encryption)

**Pre-release full regression:**
1. All unit tests
2. All integration tests
3. All E2E tests
4. Full security audit
5. Performance benchmarks
6. Firestore usage analysis

### Test Data Strategy

**Mock Data:**
- Sample user profiles with encrypted fields
- Sample stories (small, medium, large content)
- Sample Twintuition alerts
- Sample game sessions

**Test Environment:**
- Firebase Test Project (separate from production)
- Emulated Firestore for local testing (Firebase Emulator Suite)
- Mocked network status for offline testing
- Test encryption keys

### Definition of Done (DoD)

A story is complete when:
1. ✅ All acceptance criteria met
2. ✅ Unit tests written and passing (80%+ coverage)
3. ✅ Integration tests written and passing
4. ✅ E2E tests written and passing for critical paths
5. ✅ Security tests passing (unauthorized access blocked)
6. ✅ Performance tests passing (latency < targets)
7. ✅ Firebase security rules tested and deployed
8. ✅ Encryption verified for all sensitive data
9. ✅ Code reviewed and approved
10. ✅ Manual testing on iOS and Android
11. ✅ No high-severity bugs or security issues
12. ✅ Firestore usage monitored (no runaway costs)
13. ✅ Documentation updated
14. ✅ Sprint status updated to "done"

---

## Epic 7 Tech Spec Complete ✅

**Document Status**: Draft → Ready for Review
**Next Steps**:
1. Update sprint-status.yaml: `epic-7: backlog` → `epic-7: contexted`
2. Draft all 8 story files in `/docs/stories/`
3. Begin Story 7.1 implementation (Firebase setup)
4. Use this spec as authoritative reference during development

**Document Approvers**:
- [ ] Product Manager (Ashley)
- [ ] Tech Lead
- [ ] Security Lead
- [ ] DevOps Lead

**Last Updated**: 2025-11-18
