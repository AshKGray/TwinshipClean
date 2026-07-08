# Story 7.1: Firebase Project Setup and Configuration

**Epic**: 7 - Data Synchronization & Backend
**Status**: drafted
**Story ID**: 7-1
**Estimated Effort**: Medium (4-5 hours)

---

## User Story

**As a** developer
**I want** Firebase integrated into the app
**So that** we have real-time database and authentication infrastructure

## Business Value

This story establishes the foundational backend infrastructure that enables all real-time features in Twinship. Firebase provides authentication, real-time database capabilities, offline support, and security rules - essential for twins to collaborate in real-time on stories, receive instant Twintuition alerts, and compare game results seamlessly.

## Acceptance Criteria

1. ✅ Firebase project created in Firebase Console with name "Twinship"
2. ✅ Firebase SDK installed and configured in React Native app
3. ✅ Firestore database initialized in production mode
4. ✅ Firebase Authentication enabled with email/password provider
5. ✅ Security rules deployed to Firestore
6. ✅ iOS app registered in Firebase project (Bundle ID from app.json)
7. ✅ Android app registered in Firebase project (Package name from app.json)
8. ✅ Config files (GoogleService-Info.plist, google-services.json) added to project
9. ✅ Environment variables configured for Firebase API keys
10. ✅ Test connection successful: Can create and read a test document in Firestore
11. ✅ Composite indexes created for required queries
12. ✅ Firebase SDK imports work on both iOS and Android platforms

## Technical Implementation Notes

### Firebase Console Setup Steps

1. **Create Firebase Project**:
   - Navigate to Firebase Console (console.firebase.google.com)
   - Click "Add project"
   - Project name: "Twinship"
   - Enable Google Analytics (optional)

2. **Enable Firestore**:
   - Navigate to Firestore Database in console
   - Click "Create database"
   - Start in production mode
   - Choose Firestore location (closest to target users)

3. **Enable Authentication**:
   - Navigate to Authentication in console
   - Click "Get started"
   - Enable "Email/Password" provider
   - Disable "Email link" for now

4. **Add iOS App**:
   - Navigate to Project Settings
   - Add app → iOS
   - iOS bundle ID: `com.twinship.app` (from app.json)
   - Download GoogleService-Info.plist
   - Place in project root (add to .gitignore)

5. **Add Android App**:
   - Add app → Android
   - Android package name: `com.twinship.app` (from app.json)
   - Download google-services.json
   - Place in project root (add to .gitignore)

### NPM Dependencies to Install

```bash
# Choose ONE of these options:

# Option A: Firebase Web SDK (Recommended for Expo)
npm install firebase@10.13.0

# Option B: React Native Firebase (for bare React Native)
npm install @react-native-firebase/app@20.5.0
npm install @react-native-firebase/auth@20.5.0
npm install @react-native-firebase/firestore@20.5.0
```

### Firebase Configuration File

Create `src/services/firebase/firebase.config.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import Constants from 'expo-constants';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Export app for other services
export default app;
```

### Environment Variables (.env)

```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=twinship.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=twinship
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=twinship.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**IMPORTANT**: Add `.env` to `.gitignore` to prevent committing secrets!

### Firestore Security Rules

Create `firestore.rules` in project root:

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

    // Users collection - users can only access their own profile
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }

    // Twin pairs collection
    match /twinPairs/{pairId} {
      allow read: if isTwinPairMember(pairId);
      allow create: if isAuthenticated();

      // Stories subcollection
      match /stories/{storyId} {
        allow read, create, update: if isTwinPairMember(pairId);
        allow delete: if isTwinPairMember(pairId);
      }

      // Twintuition alerts subcollection
      match /alerts/{alertId} {
        allow read: if isTwinPairMember(pairId);
        allow create: if isAuthenticated();
        allow update: if isTwinPairMember(pairId);
      }

      // Games subcollection
      match /games/{gameId} {
        allow read, create, update: if isTwinPairMember(pairId);
      }
    }

    // Invitations collection
    match /invitations/{invitationId} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated();
    }
  }
}
```

**Deploy security rules**:
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firestore rules
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

### Firestore Indexes

Create composite indexes in Firebase Console or via `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "stories",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "alerts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "recipientId", "order": "ASCENDING" },
        { "fieldPath": "sentAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "games",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "gameType", "order": "ASCENDING" },
        { "fieldPath": "completedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

### Test Connection

Create `src/services/firebase/__tests__/connection.test.ts`:

```typescript
import { db } from '../firebase.config';
import { collection, addDoc, getDoc, doc, deleteDoc } from 'firebase/firestore';

describe('Firebase Connection', () => {
  it('should successfully connect to Firestore', async () => {
    // Create test document
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'test'), testData);
    expect(docRef.id).toBeDefined();

    // Read test document
    const snapshot = await getDoc(docRef);
    expect(snapshot.exists()).toBe(true);
    expect(snapshot.data()?.test).toBe(true);

    // Clean up
    await deleteDoc(docRef);
  });
});
```

## Dependencies

### Upstream Dependencies (must be complete before starting)
- None (foundational story)

### Downstream Dependencies (blocked until this is complete)
- Story 7.2: User Authentication with Firebase
- Story 7.3: Firestore Data Models and Schema
- All other Epic 7 stories

## Files to Create/Modify

### New Files:
- `src/services/firebase/firebase.config.ts` - Firebase initialization
- `src/services/firebase/index.ts` - Export all Firebase services
- `firestore.rules` - Security rules
- `firestore.indexes.json` - Composite indexes
- `.env` - Environment variables (add to .gitignore)
- `GoogleService-Info.plist` - iOS Firebase config (add to .gitignore)
- `google-services.json` - Android Firebase config (add to .gitignore)

### Modified Files:
- `package.json` - Add Firebase SDK dependencies
- `.gitignore` - Add Firebase config files and .env
- `app.json` - Ensure Bundle ID and Package name match Firebase apps

## Testing Strategy

### Unit Tests
- ✅ Firebase config loads environment variables correctly
- ✅ Firebase app initializes without errors
- ✅ Firestore instance is defined
- ✅ Auth instance is defined

### Integration Tests
- ✅ Can create test document in Firestore
- ✅ Can read test document from Firestore
- ✅ Can delete test document from Firestore
- ✅ Security rules prevent unauthorized access

### Manual Testing Checklist
- [ ] Firebase project visible in Firebase Console
- [ ] Firestore database created and accessible
- [ ] Authentication enabled with email/password
- [ ] iOS app registered (check Project Settings)
- [ ] Android app registered (check Project Settings)
- [ ] Security rules deployed (check Firestore → Rules tab)
- [ ] Indexes created (check Firestore → Indexes tab)
- [ ] App builds successfully on iOS
- [ ] App builds successfully on Android
- [ ] Test document can be created via Firebase Console
- [ ] Test document can be read from app

## Definition of Done

- [ ] All acceptance criteria met and verified
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Manual testing checklist completed
- [ ] Firebase project configured in console
- [ ] Security rules deployed and tested
- [ ] Indexes created
- [ ] Code reviewed and approved
- [ ] No high-severity security issues
- [ ] Documentation updated (this story file)
- [ ] Sprint status updated to "done"

## Risk & Mitigation

**Risk**: Firebase SDK conflicts with Expo managed workflow
- **Mitigation**: Use Firebase Web SDK instead of React Native Firebase, test thoroughly on both platforms

**Risk**: Security rules misconfigured, allowing unauthorized access
- **Mitigation**: Write integration tests to verify rules, manual testing with different users, code review

**Risk**: Environment variables accidentally committed to repo
- **Mitigation**: Add .env and Firebase config files to .gitignore, use .env.example for documentation

## Notes for Implementation

1. **Choose SDK carefully**: Use Firebase Web SDK (`firebase` package) if using Expo managed workflow. Use React Native Firebase (`@react-native-firebase/*`) only if using bare workflow.

2. **Security first**: Test security rules thoroughly before deploying to production. Verify that users cannot access other twin pairs' data.

3. **Cost awareness**: Monitor Firestore usage in Firebase Console. Implement caching and pagination to minimize billable reads.

4. **Config file security**: Never commit actual config files or API keys. Use environment variables and .gitignore.

5. **Platform testing**: Test on both iOS and Android to ensure Firebase initializes correctly on both platforms.

---

**Related Documentation**:
- [Epic 7 Tech Spec](/docs/tech-spec-epic-7.md)
- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Web SDK Setup](https://firebase.google.com/docs/web/setup)

**Story Owner**: Backend Team
**Last Updated**: 2025-11-18
