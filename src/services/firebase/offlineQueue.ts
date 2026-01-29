/**
 * Offline Queue Service
 *
 * Manages offline operation queue with automatic sync when network returns.
 * Implements retry logic with exponential backoff.
 *
 * Story: 7-7 Offline Support and Sync Queue
 */

import NetInfo from '@react-native-community/netinfo';
import { firestoreService } from './firestore';
import { useSyncStore, type OfflineQueueItem } from '@/state/syncStore';

class OfflineQueueService {
  private isProcessing = false;
  private unsubscribe: (() => void) | null = null;
  private readonly MAX_QUEUE_SIZE = 100;

  /**
   * Initialize network listener
   */
  init() {
    console.log('🔌 Initializing offline queue service...');

    this.unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected === true && state.isInternetReachable !== false;
      useSyncStore.getState().setOnlineStatus(isOnline);

      if (isOnline && !this.isProcessing) {
        console.log('🌐 Network restored, processing queue...');
        this.processQueue();
      }
    });

    // Check initial network status
    NetInfo.fetch().then((state) => {
      const isOnline = state.isConnected === true && state.isInternetReachable !== false;
      useSyncStore.getState().setOnlineStatus(isOnline);
    });

    console.log('✅ Offline queue service initialized');
  }

  /**
   * Enqueue operation for offline sync
   */
  async enqueue(operation: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<void> {
    const { queuedOperations } = useSyncStore.getState();

    // Check queue size limit
    if (queuedOperations.length >= this.MAX_QUEUE_SIZE) {
      console.warn(`⚠️  Queue size limit reached (${this.MAX_QUEUE_SIZE}), removing oldest item`);
      const oldestPending = queuedOperations
        .filter(op => op.status === 'pending')
        .sort((a, b) => a.timestamp - b.timestamp)[0];

      if (oldestPending) {
        useSyncStore.getState().removeOperation(oldestPending.id);
      }
    }

    useSyncStore.getState().enqueueOperation(operation);
    console.log(`📋 Operation queued: ${operation.operation} ${operation.collection}/${operation.documentId}`);

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
    if (this.isProcessing) {
      console.log('⏳ Queue already processing, skipping...');
      return;
    }

    this.isProcessing = true;
    useSyncStore.getState().setSyncStatus('syncing');

    try {
      const { queuedOperations } = useSyncStore.getState();
      const pendingOps = queuedOperations
        .filter((op) => op.status === 'pending')
        .sort((a, b) => a.timestamp - b.timestamp); // Oldest first

      console.log(`🔄 Processing ${pendingOps.length} pending operations...`);

      for (const op of pendingOps) {
        await this.processOperation(op);
      }

      // Clear completed operations
      useSyncStore.getState().clearCompleted();

      // Update status
      const { failedCount, pendingCount } = useSyncStore.getState();
      if (failedCount > 0) {
        useSyncStore.getState().setSyncStatus('error');
        console.warn(`⚠️  ${failedCount} operations failed`);
      } else if (pendingCount === 0) {
        useSyncStore.getState().setSyncStatus('synced');
        console.log('✅ All operations synced successfully');
      }
    } catch (error) {
      console.error('❌ Error processing queue:', error);
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
      console.log(`✅ Operation synced: ${op.operation} ${op.documentId}`);
    } catch (error: any) {
      console.error(`❌ Error syncing operation:`, error);
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

      // Exponential backoff: 1s, 2s, 4s, 8s, etc.
      const backoffDelay = Math.min(Math.pow(2, op.retryCount) * 1000, 30000);
      console.log(`🔁 Retrying operation in ${backoffDelay}ms (attempt ${op.retryCount + 1}/${op.maxRetries})`);

      setTimeout(() => {
        // Get updated operation from store (in case it changed)
        const updatedOp = useSyncStore.getState().queuedOperations.find(o => o.id === op.id);
        if (updatedOp && updatedOp.status === 'pending') {
          this.processOperation(updatedOp);
        }
      }, backoffDelay);
    } else {
      // Max retries reached, mark as failed
      updateOperationStatus(op.id, 'failed', errorMessage);
      console.error(`❌ Operation failed after ${op.maxRetries} retries: ${op.id}`);

      // Notify user
      this.notifyUserOfFailure(op, errorMessage);
    }
  }

  /**
   * Retry all failed operations
   */
  async retryFailed(): Promise<void> {
    const { queuedOperations } = useSyncStore.getState();
    const failedOps = queuedOperations.filter((op) => op.status === 'failed');

    console.log(`🔁 Retrying ${failedOps.length} failed operations...`);

    for (const op of failedOps) {
      // Reset retry count and status
      useSyncStore.getState().updateOperationStatus(op.id, 'pending');

      // Reset retry count by updating the operation
      const newOps = useSyncStore.getState().queuedOperations.map((item) =>
        item.id === op.id ? { ...item, retryCount: 0, error: undefined } : item
      );
      useSyncStore.setState({ queuedOperations: newOps });
    }

    await this.processQueue();
  }

  /**
   * Notify user of sync failure
   */
  private notifyUserOfFailure(op: OfflineQueueItem, errorMessage: string): void {
    // TODO: Implement user notification (toast, alert, etc.)
    console.log(`⚠️  Sync failed for ${op.operation} ${op.collection}/${op.documentId}: ${errorMessage}`);
    console.log(`⚠️  User should be notified about this failure`);
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
    console.log('🧹 Completed operations cleared from queue');
  }

  /**
   * Clear all operations (use with caution)
   */
  async clearAllOperations(): Promise<void> {
    useSyncStore.getState().clearAll();
    console.log('🧹 All operations cleared from queue');
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      console.log('🔌 Offline queue service destroyed');
    }
  }
}

// Export singleton instance
export const offlineQueueService = new OfflineQueueService();
