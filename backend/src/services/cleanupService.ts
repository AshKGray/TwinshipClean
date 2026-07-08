import { messageService } from './messageService';
import { messageQueueService } from './messageQueueService';

export class CleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly DEFAULT_RETENTION_DAYS = 90;
  private readonly DEFAULT_GRACE_PERIOD_DAYS = 30;
  private readonly CLEANUP_INTERVAL_HOURS = 24; // Run cleanup every 24 hours

  /**
   * Start the automated cleanup process
   */
  start(): void {
    if (this.cleanupInterval) {
      console.log('Cleanup service is already running');
      return;
    }

    console.log('Starting message cleanup service...');

    // Run initial cleanup
    this.runCleanup().catch(error => {
      console.error('Initial cleanup failed:', error);
    });

    // Schedule regular cleanup
    this.cleanupInterval = setInterval(() => {
      this.runCleanup().catch(error => {
        console.error('Scheduled cleanup failed:', error);
      });
    }, this.CLEANUP_INTERVAL_HOURS * 60 * 60 * 1000); // Convert hours to milliseconds

    console.log(`Cleanup service started - running every ${this.CLEANUP_INTERVAL_HOURS} hours`);
  }

  /**
   * Stop the automated cleanup process
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Cleanup service stopped');
    }
  }

  /**
   * Run all cleanup tasks
   */
  async runCleanup(): Promise<{
    messagesMarkedForDeletion: number;
    messagesPermanentlyDeleted: number;
    queueEntriesCleaned: number;
    retryQueueProcessed: { retriedCount: number; expiredCount: number };
  }> {
    console.log('Starting cleanup tasks...');

    const retentionDays = parseInt(process.env.MESSAGE_RETENTION_DAYS || String(this.DEFAULT_RETENTION_DAYS));
    const gracePeriodDays = parseInt(process.env.MESSAGE_GRACE_PERIOD_DAYS || String(this.DEFAULT_GRACE_PERIOD_DAYS));
    const queueCleanupDays = parseInt(process.env.QUEUE_CLEANUP_DAYS || '7');

    try {
      const [
        messagesMarkedResult,
        messagesPermanentlyDeletedResult,
        queueCleanupResult,
        retryQueueResult,
      ] = await Promise.allSettled([
        // Soft delete old messages
        messageService.cleanupOldMessages(retentionDays),
        // Permanently delete soft-deleted messages after grace period
        messageService.permanentlyDeleteOldMessages(gracePeriodDays),
        // Clean up old queue entries
        messageQueueService.cleanupOldQueueEntries(queueCleanupDays),
        // Process retry queue
        messageQueueService.processRetryQueue(),
      ]);

      const results = {
        messagesMarkedForDeletion: 0,
        messagesPermanentlyDeleted: 0,
        queueEntriesCleaned: 0,
        retryQueueProcessed: { retriedCount: 0, expiredCount: 0 },
      };

      // Process results
      if (messagesMarkedResult.status === 'fulfilled') {
        results.messagesMarkedForDeletion = messagesMarkedResult.value.deletedCount;
      } else {
        console.error('Failed to mark old messages for deletion:', messagesMarkedResult.reason);
      }

      if (messagesPermanentlyDeletedResult.status === 'fulfilled') {
        results.messagesPermanentlyDeleted = messagesPermanentlyDeletedResult.value.deletedCount;
      } else {
        console.error('Failed to permanently delete old messages:', messagesPermanentlyDeletedResult.reason);
      }

      if (queueCleanupResult.status === 'fulfilled') {
        results.queueEntriesCleaned = queueCleanupResult.value.deletedCount;
      } else {
        console.error('Failed to clean up queue entries:', queueCleanupResult.reason);
      }

      if (retryQueueResult.status === 'fulfilled') {
        results.retryQueueProcessed = retryQueueResult.value;
      } else {
        console.error('Failed to process retry queue:', retryQueueResult.reason);
      }

      console.log('Cleanup tasks completed:', {
        messagesMarkedForDeletion: results.messagesMarkedForDeletion,
        messagesPermanentlyDeleted: results.messagesPermanentlyDeleted,
        queueEntriesCleaned: results.queueEntriesCleaned,
        retryQueueProcessed: results.retryQueueProcessed,
      });

      return results;
    } catch (error) {
      console.error('Error during cleanup tasks:', error);
      throw error;
    }
  }

  /**
   * Run cleanup tasks manually (for admin use)
   */
  async runManualCleanup(options: {
    retentionDays?: number;
    gracePeriodDays?: number;
    queueCleanupDays?: number;
    skipRetryQueue?: boolean;
  } = {}): Promise<{
    messagesMarkedForDeletion: number;
    messagesPermanentlyDeleted: number;
    queueEntriesCleaned: number;
    retryQueueProcessed?: { retriedCount: number; expiredCount: number };
  }> {
    console.log('Running manual cleanup with options:', options);

    const retentionDays = options.retentionDays ?? this.DEFAULT_RETENTION_DAYS;
    const gracePeriodDays = options.gracePeriodDays ?? this.DEFAULT_GRACE_PERIOD_DAYS;
    const queueCleanupDays = options.queueCleanupDays ?? 7;

    try {
      const tasks: Promise<any>[] = [
        messageService.cleanupOldMessages(retentionDays),
        messageService.permanentlyDeleteOldMessages(gracePeriodDays),
        messageQueueService.cleanupOldQueueEntries(queueCleanupDays),
      ];

      if (!options.skipRetryQueue) {
        tasks.push(messageQueueService.processRetryQueue());
      }

      const [
        messagesMarkedResult,
        messagesPermanentlyDeletedResult,
        queueCleanupResult,
        retryQueueResult,
      ] = await Promise.all(tasks);

      const results: any = {
        messagesMarkedForDeletion: messagesMarkedResult.deletedCount,
        messagesPermanentlyDeleted: messagesPermanentlyDeletedResult.deletedCount,
        queueEntriesCleaned: queueCleanupResult.deletedCount,
      };

      if (!options.skipRetryQueue && retryQueueResult) {
        results.retryQueueProcessed = retryQueueResult;
      }

      console.log('Manual cleanup completed:', results);
      return results;
    } catch (error) {
      console.error('Error during manual cleanup:', error);
      throw error;
    }
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats(): Promise<{
    isRunning: boolean;
    nextCleanupIn?: number; // milliseconds until next cleanup
    lastCleanupTime?: Date;
    configuration: {
      retentionDays: number;
      gracePeriodDays: number;
      queueCleanupDays: number;
      cleanupIntervalHours: number;
    };
  }> {
    const config = {
      retentionDays: parseInt(process.env.MESSAGE_RETENTION_DAYS || String(this.DEFAULT_RETENTION_DAYS)),
      gracePeriodDays: parseInt(process.env.MESSAGE_GRACE_PERIOD_DAYS || String(this.DEFAULT_GRACE_PERIOD_DAYS)),
      queueCleanupDays: parseInt(process.env.QUEUE_CLEANUP_DAYS || '7'),
      cleanupIntervalHours: this.CLEANUP_INTERVAL_HOURS,
    };

    const stats: any = {
      isRunning: !!this.cleanupInterval,
      configuration: config,
    };

    // TODO: Store last cleanup time in database or cache
    // For now, we'll just return the configuration

    return stats;
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalMessages: number;
    activeMessages: number;
    deletedMessages: number;
    queuedMessages: number;
    oldestMessage?: Date;
    newestMessage?: Date;
  }> {
    try {
      // This would require custom Prisma queries
      // For now, return a placeholder structure
      console.log('Storage stats requested - implement custom Prisma queries');

      return {
        totalMessages: 0,
        activeMessages: 0,
        deletedMessages: 0,
        queuedMessages: 0,
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw error;
    }
  }
}

export const cleanupService = new CleanupService();