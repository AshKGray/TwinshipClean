# Story 7.4: Real-Time Story Synchronization

**Epic**: 7 - Data Synchronization & Backend
**Status**: drafted
**Story ID**: 7-4
**Estimated Effort**: Medium (6-7 hours)

---

## User Story

**As a** paired user
**I want** stories to sync in real-time with my twin
**So that** I see my twin's edits immediately and we can collaborate on shared stories

## Business Value

Real-time story synchronization is a core differentiator of Twinship, enabling twins to collaboratively document their shared journey. Immediate synchronization creates a magical experience where edits appear instantly, making the twin connection feel tangible and strengthening engagement with the platform.

## Acceptance Criteria

1. ✅ Creating story locally syncs to Firestore within 2 seconds
2. ✅ Twin receives story update in real-time (< 2s latency)
3. ✅ Editing story syncs changes to twin's device
4. ✅ Deleting story syncs to twin's device (soft delete)
5. ✅ Conflict resolution uses last-write-wins strategy
6. ✅ Version numbers increment on each update
7. ✅ Story title and content encrypted before upload
8. ✅ Stories decrypted when retrieved from Firestore
9. ✅ Offline stories queue for sync when network returns
10. ✅ Firestore listener updates local storiesStore
11. ✅ Edit history tracks who made changes and when
12. ✅ User notified if twin edited story while offline (conflict warning)

## Technical Implementation Notes

### Story Sync Service

Create `src/services/firebase/storiesSync.ts`:

```typescript
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase.config';
import { firestoreService } from './firestore';
import { EncryptionService } from './encryption';
import { getStoriesPath } from '@/models/firebase/collections';
import type { StoryDoc } from '@/models/firebase/schema';
import type { Story } from '@/types';
import { useStoriesStore } from '@/state/storiesStore';
import { useTwinStore } from '@/state/twinStore';
import * as SecureStore from 'expo-secure-store';
import { v4 as uuidv4 } from 'uuid';

class StorySyncService {
  private encryptionService: EncryptionService;
  private listeners: Map<string, Unsubscribe> = new Map();

  constructor() {
    this.encryptionService = new EncryptionService();
  }

  /**
   * Create story and sync to Firestore
   */
  async createStory(twinPairId: string, story: Story): Promise<void> {
    try {
      const userId = useTwinStore.getState().userProfile?.id;
      if (!userId) throw new Error('User not authenticated');

      // Get encryption key
      const encryptionKey = await SecureStore.getItemAsync(`encryption_key_${userId}`);
      if (!encryptionKey) throw new Error('Encryption key not found');

      // Encrypt sensitive fields
      const encryptedTitle = await this.encryptionService.encrypt(story.title, encryptionKey);
      const encryptedContent = await this.encryptionService.encrypt(story.content, encryptionKey);

      // Create Firestore document
      const storyDoc: Omit<StoryDoc, 'id' | 'createdAt' | 'updatedAt'> = {
        title: encryptedTitle,
        content: encryptedContent,
        createdBy: userId,
        updatedBy: userId,
        mediaUrls: story.mediaUrls,
        tags: story.tags,
        version: 1,
        editHistory: [{
          userId,
          timestamp: Timestamp.now(),
          changes: 'Story created'
        }],
        isDeleted: false,
      };

      const storiesPath = getStoriesPath(twinPairId);
      await firestoreService.createDocument(storiesPath, story.id, storyDoc);

      console.log('Story created and synced to Firestore:', story.id);
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  }

  /**
   * Update story and sync to Firestore
   */
  async updateStory(
    twinPairId: string,
    storyId: string,
    updates: Partial<Story>
  ): Promise<void> {
    try {
      const userId = useTwinStore.getState().userProfile?.id;
      if (!userId) throw new Error('User not authenticated');

      // Get encryption key
      const encryptionKey = await SecureStore.getItemAsync(`encryption_key_${userId}`);
      if (!encryptionKey) throw new Error('Encryption key not found');

      // Get current story to check version
      const storiesPath = getStoriesPath(twinPairId);
      const currentStory = await firestoreService.getDocument<StoryDoc>(
        storiesPath,
        storyId
      );

      if (!currentStory) {
        throw new Error('Story not found');
      }

      // Encrypt updated fields
      const encryptedUpdates: Partial<StoryDoc> = {
        updatedBy: userId,
        version: currentStory.version + 1,
      };

      if (updates.title) {
        encryptedUpdates.title = await this.encryptionService.encrypt(updates.title, encryptionKey);
      }

      if (updates.content) {
        encryptedUpdates.content = await this.encryptionService.encrypt(updates.content, encryptionKey);
      }

      if (updates.tags) {
        encryptedUpdates.tags = updates.tags;
      }

      // Add edit history entry
      const editEntry = {
        userId,
        timestamp: Timestamp.now(),
        changes: 'Story updated'
      };

      encryptedUpdates.editHistory = [
        ...(currentStory.editHistory || []),
        editEntry
      ];

      await firestoreService.updateDocument(storiesPath, storyId, encryptedUpdates);

      console.log('Story updated and synced to Firestore:', storyId);
    } catch (error) {
      console.error('Error updating story:', error);
      throw error;
    }
  }

  /**
   * Delete story (soft delete)
   */
  async deleteStory(twinPairId: string, storyId: string): Promise<void> {
    try {
      const userId = useTwinStore.getState().userProfile?.id;
      if (!userId) throw new Error('User not authenticated');

      const storiesPath = getStoriesPath(twinPairId);
      await firestoreService.updateDocument(storiesPath, storyId, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        updatedBy: userId,
      });

      console.log('Story soft deleted:', storyId);
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time story updates
   */
  subscribeToStories(
    twinPairId: string,
    callback: (stories: Story[]) => void
  ): Unsubscribe {
    const userId = useTwinStore.getState().userProfile?.id;
    if (!userId) throw new Error('User not authenticated');

    const storiesPath = getStoriesPath(twinPairId);
    const collectionRef = collection(db, storiesPath);

    // Query: Get non-deleted stories, ordered by updatedAt descending
    const q = query(
      collectionRef,
      where('isDeleted', '==', false),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const encryptionKey = await SecureStore.getItemAsync(`encryption_key_${userId}`);
        if (!encryptionKey) {
          console.error('Encryption key not found');
          return;
        }

        const stories: Story[] = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data() as StoryDoc;

            // Decrypt title and content
            const decryptedTitle = await this.encryptionService.decrypt(
              data.title,
              encryptionKey
            );
            const decryptedContent = await this.encryptionService.decrypt(
              data.content,
              encryptionKey
            );

            return {
              id: doc.id,
              title: decryptedTitle,
              content: decryptedContent,
              createdBy: data.createdBy,
              createdAt: firestoreService.timestampToISO(data.createdAt as Timestamp),
              updatedAt: firestoreService.timestampToISO(data.updatedAt as Timestamp),
              updatedBy: data.updatedBy,
              mediaUrls: data.mediaUrls,
              tags: data.tags,
              version: data.version,
            } as Story;
          })
        );

        callback(stories);
      },
      (error) => {
        console.error('Error in stories snapshot:', error);
      }
    );

    this.listeners.set(twinPairId, unsubscribe);
    return unsubscribe;
  }

  /**
   * Sync local AsyncStorage stories to Firestore (one-time migration)
   */
  async syncLocalToFirestore(twinPairId: string): Promise<void> {
    try {
      const localStories = useStoriesStore.getState().stories;

      for (const story of localStories) {
        // Check if story already exists in Firestore
        const storiesPath = getStoriesPath(twinPairId);
        const existingStory = await firestoreService.getDocument<StoryDoc>(
          storiesPath,
          story.id
        );

        if (!existingStory) {
          // Story doesn't exist in Firestore, create it
          await this.createStory(twinPairId, story);
        }
      }

      console.log('Local stories synced to Firestore');
    } catch (error) {
      console.error('Error syncing local stories:', error);
      throw error;
    }
  }

  /**
   * Resolve conflict using last-write-wins strategy
   */
  resolveConflict(local: Story, remote: Story): Story {
    // Compare updatedAt timestamps
    const localTime = new Date(local.updatedAt).getTime();
    const remoteTime = new Date(remote.updatedAt).getTime();

    if (remoteTime > localTime) {
      // Remote is newer, use remote version
      console.log('Conflict resolved: Using remote version (newer)');
      return remote;
    } else {
      // Local is newer, keep local version
      console.log('Conflict resolved: Using local version (newer)');
      return local;
    }
  }

  /**
   * Unsubscribe from all listeners
   */
  unsubscribeAll(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}

// Export singleton instance
export const storySyncService = new StorySyncService();
```

### Update Stories Store

Modify `src/state/storiesStore.ts` to integrate real-time sync:

```typescript
// Add Firebase sync actions
subscribeToFirestore: (twinPairId: string) => {
  const unsubscribe = storySyncService.subscribeToStories(
    twinPairId,
    (stories) => {
      // Update local store with synced stories
      set({ stories });
    }
  );

  // Store unsubscribe function
  set({ firestoreUnsubscribe: unsubscribe });
},

unsubscribeFromFirestore: () => {
  const { firestoreUnsubscribe } = get();
  if (firestoreUnsubscribe) {
    firestoreUnsubscribe();
    set({ firestoreUnsubscribe: null });
  }
},

createStory: async (story: Story) => {
  const { twinPairId } = useTwinStore.getState();

  // Save locally first (optimistic update)
  set((state) => ({ stories: [story, ...state.stories] }));

  // Sync to Firestore
  if (twinPairId) {
    try {
      await storySyncService.createStory(twinPairId, story);
    } catch (error) {
      // Revert optimistic update on error
      set((state) => ({
        stories: state.stories.filter(s => s.id !== story.id)
      }));
      throw error;
    }
  }
},
```

## Dependencies

### Upstream Dependencies
- Story 7.1: Firebase Project Setup and Configuration
- Story 7.2: User Authentication with Firebase
- Story 7.3: Firestore Data Models and Schema

### Downstream Dependencies
- Story 7.7: Offline Support and Sync Queue (enhances offline behavior)

## Files to Create/Modify

### New Files:
- `src/services/firebase/storiesSync.ts` - Story synchronization service

### Modified Files:
- `src/state/storiesStore.ts` - Add Firebase sync actions
- `src/screens/stories/CreateStoryScreen.tsx` - Use sync service
- `src/screens/stories/EditStoryScreen.tsx` - Use sync service
- `src/screens/stories/StoryVaultScreen.tsx` - Subscribe to real-time updates

## Testing Strategy

### Unit Tests
- ✅ createStory encrypts title and content
- ✅ updateStory increments version number
- ✅ deleteStory sets isDeleted flag
- ✅ resolveConflict uses last-write-wins correctly
- ✅ Edit history entry added on each update

### Integration Tests
- ✅ Create story syncs to Firestore within 2s
- ✅ Twin receives real-time update < 2s
- ✅ Update story syncs to twin
- ✅ Delete story syncs to twin
- ✅ Listener updates local store automatically
- ✅ Encrypted data in Firestore, decrypted locally
- ✅ Version conflict detected and resolved

### E2E Tests
- ✅ Twin 1 creates story → Twin 2 sees it in real-time
- ✅ Twin 1 edits story → Twin 2 sees update immediately
- ✅ Twin 1 deletes story → Twin 2 sees deletion
- ✅ Conflict: Both twins edit offline → Last-write-wins when online

### Manual Testing Checklist
- [ ] Create story, verify appears in twin's app
- [ ] Edit story, verify changes sync to twin
- [ ] Delete story, verify removed from twin's app
- [ ] Both twins edit same story offline → Check conflict resolution
- [ ] Verify encrypted data in Firestore Console
- [ ] Measure sync latency (should be < 2s)

## Definition of Done

- [ ] All acceptance criteria met and verified
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] E2E tests written and passing
- [ ] Manual testing checklist completed
- [ ] Real-time sync latency < 2 seconds
- [ ] Conflict resolution tested
- [ ] Encryption verified
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Sprint status updated to "done"

## Risk & Mitigation

**Risk**: Conflict resolution loses user data
- **Mitigation**: Notify user of conflicts, add manual merge in Phase 2

**Risk**: Real-time listeners cause excessive Firestore reads (cost)
- **Mitigation**: Monitor Firestore usage, implement caching

**Risk**: Encryption key unavailable when receiving sync
- **Mitigation**: Queue decryption until key available, show loading state

---

**Related Documentation**:
- [Epic 7 Tech Spec](/docs/tech-spec-epic-7.md)
- [Firestore Real-Time Updates](https://firebase.google.com/docs/firestore/query-data/listen)

**Story Owner**: Backend Team
**Last Updated**: 2025-11-18
