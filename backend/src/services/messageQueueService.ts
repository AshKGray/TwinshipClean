import { PrismaClient } from '@prisma/client';
import { ChatMessage, OfflineMessage } from '../types/message';

const prisma = new PrismaClient();

export interface QueueMessageData {
  twinPairId: string;
  senderId: string;
  recipientId: string;
  messageData: ChatMessage;
  messageType: string; // 'send_message', 'typing_start', etc.
  maxAttempts?: number;
  expiresInHours?: number;
}

export class MessageQueueService {
  private processingQueues = new Set<string>(); // Track which queues are being processed
  private readonly DEFAULT_MAX_ATTEMPTS = 3;
  private readonly DEFAULT_EXPIRY_HOURS = 24;
  private readonly RETRY_DELAYS = [5000, 15000, 60000]; // 5s, 15s, 1m

  /**
   * Add message to offline queue when recipient is not connected
   */
  async queueMessage(data: QueueMessageData): Promise<string> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (data.expiresInHours || this.DEFAULT_EXPIRY_HOURS));

      const queueEntry = await prisma.messageQueue.create({
        data: {
          twinPairId: data.twinPairId,
          senderId: data.senderId,
          recipientId: data.recipientId,
          messageData: JSON.stringify(data.messageData),
          messageType: data.messageType,
          maxAttempts: data.maxAttempts || this.DEFAULT_MAX_ATTEMPTS,
          expiresAt,
          nextAttemptAt: new Date(), // Try immediately first time
        },
      });

      console.log(`Queued message for offline user ${data.recipientId}:`, queueEntry.id);
      return queueEntry.id;
    } catch (error) {
      console.error('Error queuing message:', error);
      throw new Error('Failed to queue message');
    }
  }

  /**
   * Process queued messages for a specific recipient when they come online
   */
  async processQueueForUser(userId: string): Promise<{
    processedCount: number;
    failedCount: number;
    expiredCount: number;
  }> {
    if (this.processingQueues.has(userId)) {
      console.log(`Queue for user ${userId} is already being processed`);
      return { processedCount: 0, failedCount: 0, expiredCount: 0 };
    }

    this.processingQueues.add(userId);

    try {
      // Get all pending messages for this user
      const queuedMessages = await prisma.messageQueue.findMany({
        where: {
          recipientId: userId,
          status: 'pending',
        },
        orderBy: { createdAt: 'asc' },
      });

      let processedCount = 0;
      let failedCount = 0;
      let expiredCount = 0;

      for (const queuedMessage of queuedMessages) {
        try {
          // Check if message has expired
          if (new Date() > queuedMessage.expiresAt) {
            await this.markMessageExpired(queuedMessage.id);
            expiredCount++;
            continue;
          }

          // Process the message
          const success = await this.processQueuedMessage(queuedMessage);

          if (success) {
            await this.markMessageDelivered(queuedMessage.id);
            processedCount++;
          } else {
            // Check if we should retry or mark as failed
            if (queuedMessage.attempts >= queuedMessage.maxAttempts) {
              await this.markMessageFailed(queuedMessage.id, 'Max attempts reached');
              failedCount++;
            } else {
              await this.scheduleRetry(queuedMessage.id, queuedMessage.attempts);
            }
          }
        } catch (error) {
          console.error(`Error processing queued message ${queuedMessage.id}:`, error);
          await this.markMessageFailed(queuedMessage.id, error instanceof Error ? error.message : 'Unknown error');
          failedCount++;
        }
      }

      console.log(`Queue processing complete for user ${userId}:`, {
        processedCount,
        failedCount,
        expiredCount,
      });

      return { processedCount, failedCount, expiredCount };
    } finally {
      this.processingQueues.delete(userId);
    }
  }

  /**
   * Process a single queued message
   */
  private async processQueuedMessage(queuedMessage: any): Promise<boolean> {
    try {
      // Increment attempt counter
      await prisma.messageQueue.update({
        where: { id: queuedMessage.id },
        data: {
          attempts: queuedMessage.attempts + 1,
          status: 'processing',
        },
      });

      // Parse message data
      const messageData: ChatMessage = JSON.parse(queuedMessage.messageData);

      // Here you would emit the message to the connected user
      // This depends on your WebSocket implementation
      // For now, we'll simulate successful delivery
      console.log(`Delivering queued message to user ${queuedMessage.recipientId}:`, messageData.id);

      // TODO: Emit message via WebSocket to connected user
      // websocketService.emitToUser(queuedMessage.recipientId, 'message', messageData);

      return true; // Assume success for now
    } catch (error) {
      console.error('Error processing queued message:', error);
      return false;
    }
  }

  /**
   * Mark message as successfully delivered
   */
  private async markMessageDelivered(queueId: string): Promise<void> {
    await prisma.messageQueue.update({
      where: { id: queueId },
      data: {
        status: 'delivered',
        processedAt: new Date(),
      },
    });
  }

  /**
   * Mark message as failed
   */
  private async markMessageFailed(queueId: string, errorMessage: string): Promise<void> {
    await prisma.messageQueue.update({
      where: { id: queueId },
      data: {
        status: 'failed',
        errorMessage,
        processedAt: new Date(),
      },
    });
  }

  /**
   * Mark message as expired
   */
  private async markMessageExpired(queueId: string): Promise<void> {
    await prisma.messageQueue.update({
      where: { id: queueId },
      data: {
        status: 'expired',
        processedAt: new Date(),
      },
    });
  }

  /**
   * Schedule retry for failed message
   */
  private async scheduleRetry(queueId: string, currentAttempts: number): Promise<void> {
    const retryDelay = this.RETRY_DELAYS[Math.min(currentAttempts, this.RETRY_DELAYS.length - 1)];
    const nextAttemptAt = new Date();
    nextAttemptAt.setMilliseconds(nextAttemptAt.getMilliseconds() + retryDelay);

    await prisma.messageQueue.update({
      where: { id: queueId },
      data: {
        status: 'pending',
        nextAttemptAt,
      },
    });
  }

  /**
   * Get queue statistics for a twin pair
   */
  async getQueueStats(twinPairId: string): Promise<{
    pending: number;
    processing: number;
    delivered: number;
    failed: number;
    expired: number;
  }> {
    try {
      const stats = await prisma.messageQueue.groupBy({
        by: ['status'],
        where: { twinPairId },
        _count: true,
      });

      const result = {
        pending: 0,
        processing: 0,
        delivered: 0,
        failed: 0,
        expired: 0,
      };

      stats.forEach((stat) => {
        if (stat.status in result) {
          (result as any)[stat.status] = stat._count;
        }
      });

      return result;
    } catch (error) {
      console.error('Error getting queue stats:', error);
      throw new Error('Failed to get queue statistics');
    }
  }

  /**
   * Clean up old queue entries
   */
  async cleanupOldQueueEntries(olderThanDays: number = 7): Promise<{ deletedCount: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await prisma.messageQueue.deleteMany({
        where: {
          OR: [
            { status: 'delivered', processedAt: { lt: cutoffDate } },
            { status: 'failed', processedAt: { lt: cutoffDate } },
            { status: 'expired', processedAt: { lt: cutoffDate } },
          ],
        },
      });

      console.log(`Cleaned up ${result.count} old queue entries`);
      return { deletedCount: result.count };
    } catch (error) {
      console.error('Error cleaning up queue entries:', error);
      throw new Error('Failed to cleanup queue entries');
    }
  }

  /**
   * Process retry queue - called periodically to retry failed messages
   */
  async processRetryQueue(): Promise<{ retriedCount: number; expiredCount: number }> {
    try {
      const now = new Date();

      // Get messages that are ready for retry
      const retryMessages = await prisma.messageQueue.findMany({
        where: {
          status: 'pending',
          nextAttemptAt: { lte: now },
          attempts: { lt: prisma.messageQueue.fields.maxAttempts },
        },
        orderBy: { nextAttemptAt: 'asc' },
        take: 100, // Process up to 100 at a time
      });

      let retriedCount = 0;
      let expiredCount = 0;

      for (const message of retryMessages) {
        try {
          // Check if expired
          if (now > message.expiresAt) {
            await this.markMessageExpired(message.id);
            expiredCount++;
            continue;
          }

          // Try to process the message
          const success = await this.processQueuedMessage(message);

          if (success) {
            await this.markMessageDelivered(message.id);
            retriedCount++;
          } else {
            // Schedule next retry if attempts available
            if (message.attempts + 1 >= message.maxAttempts) {
              await this.markMessageFailed(message.id, 'Max retry attempts reached');
            } else {
              await this.scheduleRetry(message.id, message.attempts + 1);
            }
          }
        } catch (error) {
          console.error(`Error retrying message ${message.id}:`, error);
          await this.markMessageFailed(message.id, error instanceof Error ? error.message : 'Retry error');
        }
      }

      return { retriedCount, expiredCount };
    } catch (error) {
      console.error('Error processing retry queue:', error);
      throw new Error('Failed to process retry queue');
    }
  }
}

export const messageQueueService = new MessageQueueService();