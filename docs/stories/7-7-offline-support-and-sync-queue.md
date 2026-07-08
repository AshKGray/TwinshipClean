# Story 7.7: Offline Support and Sync Queue

**Epic**: 7 - Data Synchronization & Backend
**Status**: drafted
**Story ID**: 7-7
**Estimated Effort**: Medium (6-7 hours)

---

## User Story

**As a** user
**I want** the app to work offline and sync when I'm back online
**So that** I'm not blocked by connectivity and don't lose any data

## Business Value

Offline-first architecture is critical for mobile app reliability and user trust. Users expect apps to work anywhere, anytime. By queuing operations and syncing when online, Twinship ensures data never gets lost and users remain productive even without connectivity.

## Acceptance Criteria

1. ✅ Network status detected accurately (online/offline)
2. ✅ Offline operations queue to AsyncStorage
3. ✅ Queued operations process automatically when back online
4. ✅ Failed operations retry with exponential backoff
5. ✅ Max retries enforced (default: 3 attempts)
6. ✅ Sync status indicator shows current state (syncing, synced, offline, error)
7. ✅ User notified of sync failures after max retries
8. ✅ Queue persists across app restarts
9. ✅ Completed operations removed from queue
10. ✅ Queue health metrics available in syncStore (pending, failed counts)
11. ✅ Sync completes within 5 seconds for typical queue (10 items)
12. ✅ Queue operations ordered by timestamp (oldest first)

## Technical Implementation Notes

### Sync Store

Create `src/state/syncStore.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface OfflineQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  collection: string;
  documentId: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;
}

interface SyncState {
  status: SyncStatus;
  lastSyncedAt?: number;
  queuedOperations: OfflineQueueItem[];
  pendingCount: number;
  failedCount: number;
  isOnline: boolean;

  // Actions
  setOnlineStatus: (online: boolean) => void;
  setSyncStatus: (status: SyncStatus) => void;
  enqueueOperation: (operation: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount' | 'status'>) => void;
  updateOperationStatus: (id: string, status: OfflineQueueItem['status'], error?: string) => void;
  removeOperation: (id: string) => void;
  incrementRetry: (id: string) => void;
  clearCompleted: () => void;
  getQueueStatus: () => { total: number; pending: number; completed: number; failed: number };
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      status: 'synced',
      lastSyncedAt: undefined,
      queuedOperations: [],
      pendingCount: 0,
      failedCount: 0,
      isOnline: true,

      setOnlineStatus: (online) => {
        set({ isOnline: online, status: online ? 'synced' : 'offline' });
      },

      setSyncStatus: (status) => {
        set({ status });
        if (status === 'synced') {
          set({ lastSyncedAt: Date.now() });
        }
      },

      enqueueOperation: (operation) => {
        const item: OfflineQueueItem = {
          ...operation,
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          retryCount: 0,
          status: 'pending',
        };

        set((state) => ({
          queuedOperations: [...state.queuedOperations, item],
          pendingCount: state.pendingCount + 1,
        }));
      },

      updateOperationStatus: (id, status, error) => {
        set((state) => ({
          queuedOperations: state.queuedOperations.map((op) =>
            op.id === id ? { ...op, status, error } : op
          ),
          pendingCount: status === 'completed' ? state.pendingCount - 1 : state.pendingCount,
          failedCount: status === 'failed' ? state.failedCount + 1 : state.failedCount,
        }));
      },

      removeOperation: (id) => {
        set((state) => ({
          queuedOperations: state.queuedOperations.filter((op) => op.id !== id),
        }));
      },

      incrementRetry: (id) => {
        set((state) => ({
          queuedOperations: state.queuedOperations.map((op) =>
            op.id === id ? { ...op, retryCount: op.retryCount + 1 } : op
          ),
        }));
      },

      clearCompleted: () => {
        set((state) => ({
          queuedOperations: state.queuedOperations.filter((op) => op.status !== 'completed'),
        }));
      },

      getQueueStatus: () => {
        const operations = get().queuedOperations;
        return {
          total: operations.length,
          pending: operations.filter((op) => op.status === 'pending').length,
          completed: operations.filter((op) => op.status === 'completed').length,
          failed: operations.filter((op) => op.status === 'failed').length,
        };
      },
    }),
    {
      name: 'twinship-sync',
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
    }
  )
);
```

### Offline Queue Service

Create `src/services/firebase/offlineQueue.ts`:

```typescript
import NetInfo from '@react-native-community/netinfo';
import { firestoreService } from './firestore';
import { useSyncStore, type OfflineQueueItem } from '@/state/syncStore';

class OfflineQueueService {
  private isProcessing = false;
  private unsubscribe: (() => void) | null = null;

  /**
   * Initialize network listener
   */
  init() {
    this.unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected === true;
      useSyncStore.getState().setOnlineStatus(isOnline);

      if (isOnline && !this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Enqueue operation for offline sync
   */
  async enqueue(operation: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<void> {
    useSyncStore.getState().enqueueOperation(operation);
    console.log('Operation enqueued:', operation.operation, operation.collection);

    // Try to process immediately if online
    const { isOnline } = useSyncStore.getState();
    if (isOnline) {
      await this.processQueue();
    }
  }

  /**
   * Process all pending operations in queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    useSyncStore.getState().setSyncStatus('syncing');

    try {
      const { queuedOperations } = useSyncStore.getState();
      const pendingOps = queuedOperations
        .filter((op) => op.status === 'pending')
        .sort((a, b) => a.timestamp - b.timestamp); // Oldest first

      for (const op of pendingOps) {
        await this.processOperation(op);
      }

      // Clear completed operations
      useSyncStore.getState().clearCompleted();

      // Update status
      const { failedCount, pendingCount } = useSyncStore.getState();
      if (failedCount > 0) {
        useSyncStore.getState().setSyncStatus('error');
      } else if (pendingCount === 0) {
        useSyncStore.getState().setSyncStatus('synced');
      }
    } catch (error) {
      console.error('Error processing queue:', error);
      useSyncStore.getState().setSyncStatus('error');
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process single operation
   */
  private async processOperation(op: OfflineQueueItem): Promise<void> {
    try {
      useSyncStore.getState().updateOperationStatus(op.id, 'syncing');

      // Execute Firestore operation
      switch (op.operation) {
        case 'create':
          await firestoreService.createDocument(op.collection, op.documentId, op.data);
          break;
        case 'update':
          await firestoreService.updateDocument(op.collection, op.documentId, op.data);
          break;
        case 'delete':
          await firestoreService.deleteDocument(op.collection, op.documentId);
          break;
      }

      // Mark as completed
      useSyncStore.getState().updateOperationStatus(op.id, 'completed');
      console.log('Operation synced:', op.operation, op.documentId);
    } catch (error: any) {
      console.error('Error syncing operation:', error);
      await this.handleOperationFailure(op, error.message);
    }
  }

  /**
   * Handle operation failure with retry logic
   */
  private async handleOperationFailure(op: OfflineQueueItem, errorMessage: string): Promise<void> {
    const { incrementRetry, updateOperationStatus } = useSyncStore.getState();

    if (op.retryCount < op.maxRetries) {
      // Increment retry count and retry later
      incrementRetry(op.id);
      updateOperationStatus(op.id, 'pending');

      // Exponential backoff
      const backoffDelay = Math.pow(2, op.retryCount) * 1000; // 1s, 2s, 4s, etc.
      console.log(`Retrying operation in ${backoffDelay}ms (attempt ${op.retryCount + 1})`);

      setTimeout(() => {
        this.processOperation(op);
      }, backoffDelay);
    } else {
      // Max retries reached, mark as failed
      updateOperationStatus(op.id, 'failed', errorMessage);
      console.error('Operation failed after max retries:', op.id);

      // Notify user
      this.notifyUserOfFailure(op);
    }
  }

  /**
   * Retry all failed operations
   */
  async retryFailed(): Promise<void> {
    const { queuedOperations } = useSyncStore.getState();
    const failedOps = queuedOperations.filter((op) => op.status === 'failed');

    for (const op of failedOps) {
      // Reset retry count and status
      useSyncStore.getState().updateOperationStatus(op.id, 'pending');
      useSyncStore.setState({
        queuedOperations: queuedOperations.map((item) =>
          item.id === op.id ? { ...item, retryCount: 0 } : item
        ),
      });
    }

    await this.processQueue();
  }

  /**
   * Notify user of sync failure
   */
  private notifyUserOfFailure(op: OfflineQueueItem): void {
    // TODO: Show toast notification or alert
    console.log('Sync failed - notify user:', op.error);
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return useSyncStore.getState().getQueueStatus();
  }

  /**
   * Clear all completed operations
   */
  async clearQueue(): Promise<void> {
    useSyncStore.getState().clearCompleted();
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

// Export singleton instance
export const offlineQueueService = new OfflineQueueService();
```

### Sync Status Indicator Component

Create `src/components/SyncStatusIndicator.tsx`:

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import { useSyncStore } from '@/state/syncStore';
import { Ionicons } from '@expo/vector-icons';

export function SyncStatusIndicator() {
  const { status, pendingCount, isOnline } = useSyncStore();

  if (status === 'synced' && pendingCount === 0) return null;

  const getStatusInfo = () => {
    switch (status) {
      case 'syncing':
        return { icon: 'sync', color: 'text-blue-500', text: 'Syncing...' };
      case 'offline':
        return { icon: 'cloud-offline', color: 'text-gray-500', text: 'Offline' };
      case 'error':
        return { icon: 'warning', color: 'text-red-500', text: 'Sync error' };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();
  if (!statusInfo) return null;

  return (
    <View className="flex-row items-center px-4 py-2 bg-gray-800/50">
      <Ionicons name={statusInfo.icon as any} size={16} className={statusInfo.color} />
      <Text className={`ml-2 text-sm ${statusInfo.color}`}>
        {statusInfo.text}
        {pendingCount > 0 && ` (${pendingCount} pending)`}
      </Text>
    </View>
  );
}
```

### Integration with Services

Modify story sync, alert sync, and game sync services to use offline queue:

```typescript
// In storiesSync.ts, twintuitionSync.ts, gamesSync.ts
import { offlineQueueService } from './offlineQueue';
import { useSyncStore } from '@/state/syncStore';

// Example in createStory:
async createStory(twinPairId: string, story: Story): Promise<void> {
  const { isOnline } = useSyncStore.getState();

  if (!isOnline) {
    // Queue for offline sync
    await offlineQueueService.enqueue({
      operation: 'create',
      collection: getStoriesPath(twinPairId),
      documentId: story.id,
      data: { /* encrypted story data */ },
      maxRetries: 3,
    });
    return;
  }

  // Online, sync immediately
  // ... existing code ...
}
```

## Dependencies

### Upstream Dependencies
- Story 7.1: Firebase Project Setup and Configuration
- Story 7.2: User Authentication with Firebase
- Story 7.3: Firestore Data Models and Schema
- Story 7.4: Real-Time Story Synchronization
- Story 7.5: Real-Time Twintuition Alert Delivery
- Story 7.6: Game Results Synchronization

### Downstream Dependencies
- None (enhances all sync features)

## Files to Create/Modify

### New Files:
- `src/state/syncStore.ts` - Zustand sync state and queue management
- `src/services/firebase/offlineQueue.ts` - Offline queue service
- `src/components/SyncStatusIndicator.tsx` - Sync status UI component

### Modified Files:
- `src/services/firebase/storiesSync.ts` - Integrate offline queue
- `src/services/firebase/twintuitionSync.ts` - Integrate offline queue
- `src/services/firebase/gamesSync.ts` - Integrate offline queue
- `App.tsx` - Initialize offline queue service

## Testing Strategy

### Unit Tests
- ✅ Network status changes detected
- ✅ Operations enqueue correctly
- ✅ Queue persists to AsyncStorage
- ✅ Exponential backoff calculated correctly
- ✅ Max retries enforced
- ✅ Completed operations cleared

### Integration Tests
- ✅ Go offline → Create story → Queue added
- ✅ Go online → Queue processes automatically
- ✅ Failed operation retries with backoff
- ✅ Max retries → Operation marked failed
- ✅ Queue persists across app restart

### E2E Tests
- ✅ Offline mode: Create story → Go online → Story synced
- ✅ Poor network: Operation fails → Retries → Succeeds
- ✅ Permanent failure: Max retries → User notified

### Performance Tests
- ✅ 10 queued operations sync < 5 seconds
- ✅ Queue with 100 items performs well

### Manual Testing Checklist
- [ ] Enable airplane mode, create story, verify queued
- [ ] Disable airplane mode, verify auto-sync
- [ ] Force sync failure (invalid data), verify retry
- [ ] Verify sync status indicator shows correct state
- [ ] Kill app with pending queue, restart, verify queue processes

## Definition of Done

- [ ] All acceptance criteria met and verified
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] E2E tests written and passing
- [ ] Performance tests passing (< 5s for 10 items)
- [ ] Manual testing checklist completed
- [ ] Sync indicator displays correctly
- [ ] Queue persists across restart
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Sprint status updated to "done"

## Risk & Mitigation

**Risk**: Queue grows unbounded, exhausts storage
- **Mitigation**: Set max queue size (100 items), expire old items

**Risk**: Network detection unreliable
- **Mitigation**: Use NetInfo library, test on various network conditions

**Risk**: Retry logic causes infinite loops
- **Mitigation**: Enforce max retries, exponential backoff with max delay

---

**Related Documentation**:
- [Epic 7 Tech Spec](/docs/tech-spec-epic-7.md)
- [NetInfo Documentation](https://github.com/react-native-netinfo/react-native-netinfo)

**Story Owner**: Backend Team
**Last Updated**: 2025-11-18
