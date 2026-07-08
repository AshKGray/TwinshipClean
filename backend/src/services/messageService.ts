import { PrismaClient } from '@prisma/client';
import { ChatMessage, MessageStatus, MessageType } from '../types/message';

const prisma = new PrismaClient();

export interface CreateMessageData {
  twinPairId: string;
  senderId: string;
  recipientId: string;
  content: string;
  messageType?: MessageType;
  accentColor?: string;
  originalMessageId?: string; // For reactions/replies
}

export interface MessageFilters {
  twinPairId: string;
  before?: Date;
  after?: Date;
  messageType?: MessageType;
  limit?: number;
  offset?: number;
}

export class MessageService {
  /**
   * Save message to database with delivery status
   */
  async saveMessage(messageData: CreateMessageData): Promise<ChatMessage> {
    try {
      const message = await prisma.message.create({
        data: {
          id: messageData.originalMessageId || undefined, // Use provided ID or generate new one
          twinPairId: messageData.twinPairId,
          senderId: messageData.senderId,
          recipientId: messageData.recipientId,
          content: messageData.content,
          messageType: messageData.messageType || 'text',
          accentColor: messageData.accentColor,
          originalMessageId: messageData.originalMessageId,
          deliveredAt: null, // Will be set when delivered
          readAt: null, // Will be set when read
        },
        include: {
          sender: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          recipient: {
            select: {
              id: true,
              displayName: true,
            },
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                },
              },
            },
          },
        },
      });

      return this.formatMessage(message);
    } catch (error) {
      console.error('Error saving message:', error);
      throw new Error('Failed to save message');
    }
  }

  /**
   * Mark message as delivered
   */
  async markAsDelivered(messageId: string): Promise<void> {
    try {
      await prisma.message.update({
        where: { id: messageId },
        data: { deliveredAt: new Date() },
      });
    } catch (error) {
      console.error('Error marking message as delivered:', error);
      throw new Error('Failed to mark message as delivered');
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await prisma.message.update({
        where: { id: messageId },
        data: { readAt: new Date() },
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw new Error('Failed to mark message as read');
    }
  }

  /**
   * Get message history with pagination
   */
  async getMessageHistory(filters: MessageFilters): Promise<{
    messages: ChatMessage[];
    hasMore: boolean;
    totalCount: number;
  }> {
    try {
      const limit = Math.min(filters.limit || 50, 100); // Cap at 100 messages
      const offset = filters.offset || 0;

      const where: any = {
        twinPairId: filters.twinPairId,
        deletedAt: null, // Only get non-deleted messages
      };

      if (filters.before) {
        where.createdAt = { lt: filters.before };
      }

      if (filters.after) {
        where.createdAt = { ...where.createdAt, gt: filters.after };
      }

      if (filters.messageType) {
        where.messageType = filters.messageType;
      }

      const [messages, totalCount] = await Promise.all([
        prisma.message.findMany({
          where,
          include: {
            sender: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            recipient: {
              select: {
                id: true,
                displayName: true,
              },
            },
            reactions: {
              include: {
                user: {
                  select: {
                    id: true,
                    displayName: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit + 1, // Get one extra to check if there are more
          skip: offset,
        }),
        prisma.message.count({ where }),
      ]);

      const hasMore = messages.length > limit;
      const messagesToReturn = hasMore ? messages.slice(0, -1) : messages;

      return {
        messages: messagesToReturn.map(this.formatMessage),
        hasMore,
        totalCount,
      };
    } catch (error) {
      console.error('Error getting message history:', error);
      throw new Error('Failed to retrieve message history');
    }
  }

  /**
   * Get undelivered messages for a user (offline queue support)
   */
  async getUndeliveredMessages(userId: string, twinPairId?: string): Promise<ChatMessage[]> {
    try {
      const where: any = {
        recipientId: userId,
        deliveredAt: null,
        deletedAt: null,
      };

      if (twinPairId) {
        where.twinPairId = twinPairId;
      }

      const messages = await prisma.message.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          recipient: {
            select: {
              id: true,
              displayName: true,
            },
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return messages.map(this.formatMessage);
    } catch (error) {
      console.error('Error getting undelivered messages:', error);
      throw new Error('Failed to retrieve undelivered messages');
    }
  }

  /**
   * Add reaction to message
   */
  async addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    try {
      await prisma.messageReaction.upsert({
        where: {
          messageId_userId_emoji: {
            messageId,
            userId,
            emoji,
          },
        },
        create: {
          messageId,
          userId,
          emoji,
        },
        update: {
          // If reaction already exists, just update timestamp
          createdAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw new Error('Failed to add reaction');
    }
  }

  /**
   * Remove reaction from message
   */
  async removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    try {
      await prisma.messageReaction.delete({
        where: {
          messageId_userId_emoji: {
            messageId,
            userId,
            emoji,
          },
        },
      });
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw new Error('Failed to remove reaction');
    }
  }

  /**
   * Clean up old messages based on retention policy
   */
  async cleanupOldMessages(retentionDays: number = 90): Promise<{ deletedCount: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Soft delete messages older than retention period
      const result = await prisma.message.updateMany({
        where: {
          createdAt: { lt: cutoffDate },
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      console.log(`Soft deleted ${result.count} messages older than ${retentionDays} days`);
      return { deletedCount: result.count };
    } catch (error) {
      console.error('Error cleaning up old messages:', error);
      throw new Error('Failed to cleanup old messages');
    }
  }

  /**
   * Permanently delete messages that have been soft deleted for a period
   */
  async permanentlyDeleteOldMessages(gracePeriodDays: number = 30): Promise<{ deletedCount: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - gracePeriodDays);

      // First delete all reactions for these messages
      await prisma.messageReaction.deleteMany({
        where: {
          message: {
            deletedAt: { lt: cutoffDate },
          },
        },
      });

      // Then permanently delete the messages
      const result = await prisma.message.deleteMany({
        where: {
          deletedAt: { lt: cutoffDate },
        },
      });

      console.log(`Permanently deleted ${result.count} messages after ${gracePeriodDays} days grace period`);
      return { deletedCount: result.count };
    } catch (error) {
      console.error('Error permanently deleting old messages:', error);
      throw new Error('Failed to permanently delete old messages');
    }
  }

  /**
   * Format database message to ChatMessage interface
   */
  private formatMessage(dbMessage: any): ChatMessage {
    return {
      id: dbMessage.id,
      text: dbMessage.content,
      senderId: dbMessage.senderId,
      senderName: dbMessage.sender?.displayName || 'Unknown',
      timestamp: dbMessage.createdAt.toISOString(),
      type: dbMessage.messageType as MessageType,
      accentColor: dbMessage.accentColor || '#007AFF',
      isDelivered: !!dbMessage.deliveredAt,
      isRead: !!dbMessage.readAt,
      reactions: dbMessage.reactions?.map((reaction: any) => ({
        id: reaction.id,
        emoji: reaction.emoji,
        userId: reaction.userId,
        userName: reaction.user?.displayName || 'Unknown',
        timestamp: reaction.createdAt.toISOString(),
      })) || [],
      originalMessageId: dbMessage.originalMessageId,
      createdAt: dbMessage.createdAt.toISOString(),
      updatedAt: dbMessage.updatedAt.toISOString(),
    };
  }
}

export const messageService = new MessageService();