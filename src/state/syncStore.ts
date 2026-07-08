/**
 * Sync Store - Offline Queue Management
 *
 * Manages offline operation queue and network sync status.
 * Persists to AsyncStorage for reliability across app restarts.
 *
 * Story: 7-7 Offline Support and Sync Queue
 */

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
  clearAll: () => void;
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
        console.log(`🌐 Network status: ${online ? 'online' : 'offline'}`);
      },

      setSyncStatus: (status) => {
        set({ status });
        if (status === 'synced') {
          set({ lastSyncedAt: Date.now() });
        }
        console.log(`🔄 Sync status: ${status}`);
      },

      enqueueOperation: (operation) => {
        const item: OfflineQueueItem = {
          ...operation,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          retryCount: 0,
          status: 'pending',
        };

        set((state) => ({
          queuedOperations: [...state.queuedOperations, item],
          pendingCount: state.pendingCount + 1,
        }));

        console.log(`📋 Operation queued: ${operation.operation} ${operation.collection}/${operation.documentId}`);
      },

      updateOperationStatus: (id, status, error) => {
        set((state) => {
          const oldOp = state.queuedOperations.find(op => op.id === id);
          const oldStatus = oldOp?.status;

          return {
            queuedOperations: state.queuedOperations.map((op) =>
              op.id === id ? { ...op, status, error } : op
            ),
            pendingCount: status === 'completed' && oldStatus === 'pending'
              ? state.pendingCount - 1
              : state.pendingCount,
            failedCount: status === 'failed' && oldStatus !== 'failed'
              ? state.failedCount + 1
              : state.failedCount,
          };
        });

        console.log(`📊 Operation ${id} status: ${status}`);
      },

      removeOperation: (id) => {
        set((state) => {
          const op = state.queuedOperations.find(o => o.id === id);
          return {
            queuedOperations: state.queuedOperations.filter((op) => op.id !== id),
            pendingCount: op?.status === 'pending'
              ? state.pendingCount - 1
              : state.pendingCount,
            failedCount: op?.status === 'failed'
              ? state.failedCount - 1
              : state.failedCount,
          };
        });

        console.log(`🗑️  Operation removed: ${id}`);
      },

      incrementRetry: (id) => {
        set((state) => ({
          queuedOperations: state.queuedOperations.map((op) =>
            op.id === id ? { ...op, retryCount: op.retryCount + 1 } : op
          ),
        }));

        const op = get().queuedOperations.find(o => o.id === id);
        console.log(`🔁 Retry attempt ${op?.retryCount}/${op?.maxRetries} for ${id}`);
      },

      clearCompleted: () => {
        set((state) => ({
          queuedOperations: state.queuedOperations.filter((op) => op.status !== 'completed'),
        }));

        console.log(`🧹 Cleared completed operations`);
      },

      clearAll: () => {
        set({
          queuedOperations: [],
          pendingCount: 0,
          failedCount: 0,
          status: 'synced',
        });

        console.log(`🧹 Cleared all queued operations`);
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
