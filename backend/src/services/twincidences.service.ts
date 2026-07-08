import { prisma } from '../server';
import { logger } from '../utils/logger';

export interface CreateTwincidenceData {
  twinPairId: string;
  createdBy?: string;
  title: string;
  description: string;
  photos?: string[]; // Will be stringified JSON
  eventType: string;
  detectionMethod?: string;
  user1EventTime?: Date;
  user2EventTime?: Date;
  timeDifference?: number;
  eventData?: object;
  isSpecial?: boolean;
  severity?: string;
}

export interface UpdateTwincidenceData {
  title?: string;
  description?: string;
  photos?: string[];
  isSpecial?: boolean;
  severity?: string;
}

export interface TwintuitionPressData {
  userId: string;
  twinPairId: string;
  pressTime: Date;
}

class TwincidencesService {
  /**
   * Create a new twincidence (manual or auto-detected)
   */
  async createTwincidence(data: CreateTwincidenceData) {
    try {
      // Check if both users have consented to share this event type
      const canShare = await this.checkDualConsent(
        data.twinPairId,
        data.eventType
      );

      const twincidence = await prisma.twincidence.create({
        data: {
          twinPairId: data.twinPairId,
          createdBy: data.createdBy,
          title: data.title,
          description: data.description,
          photos: data.photos ? JSON.stringify(data.photos) : null,
          eventType: data.eventType,
          detectionMethod: data.detectionMethod,
          user1EventTime: data.user1EventTime,
          user2EventTime: data.user2EventTime,
          timeDifference: data.timeDifference,
          eventData: data.eventData ? JSON.stringify(data.eventData) : null,
          sharedWithTwin: canShare,
          user1Consented: canShare,
          user2Consented: canShare,
          isSpecial: data.isSpecial ?? false,
          severity: data.severity,
        },
      });

      logger.info(`Twincidence created: ${twincidence.id}`);
      return this.formatTwincidence(twincidence);
    } catch (error) {
      logger.error('Error creating twincidence:', error);
      throw error;
    }
  }

  /**
   * Get all twincidences for a twin pair
   */
  async getTwincidences(twinPairId: string, userId: string) {
    try {
      // Verify user is part of this twin pair
      const twinPair = await prisma.twinPair.findUnique({
        where: { id: twinPairId },
      });

      if (!twinPair) {
        throw new Error('Twin pair not found');
      }

      if (twinPair.user1Id !== userId && twinPair.user2Id !== userId) {
        throw new Error('User is not part of this twin pair');
      }

      const twincidences = await prisma.twincidence.findMany({
        where: {
          twinPairId,
          deletedAt: null,
          OR: [
            { sharedWithTwin: true },
            { createdBy: userId }, // User can see their own even if not shared
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return twincidences.map((t) => this.formatTwincidence(t));
    } catch (error) {
      logger.error('Error fetching twincidences:', error);
      throw error;
    }
  }

  /**
   * Get a specific twincidence by ID
   */
  async getTwincidence(id: string, userId: string) {
    try {
      const twincidence = await prisma.twincidence.findUnique({
        where: { id },
      });

      if (!twincidence) {
        throw new Error('Twincidence not found');
      }

      // Verify user has access
      const twinPair = await prisma.twinPair.findUnique({
        where: { id: twincidence.twinPairId },
      });

      if (!twinPair) {
        throw new Error('Twin pair not found');
      }

      if (twinPair.user1Id !== userId && twinPair.user2Id !== userId) {
        throw new Error('Access denied');
      }

      // Check if user can see this twincidence
      if (
        !twincidence.sharedWithTwin &&
        twincidence.createdBy !== userId
      ) {
        throw new Error('Access denied');
      }

      return this.formatTwincidence(twincidence);
    } catch (error) {
      logger.error('Error fetching twincidence:', error);
      throw error;
    }
  }

  /**
   * Update a twincidence
   */
  async updateTwincidence(
    id: string,
    userId: string,
    data: UpdateTwincidenceData
  ) {
    try {
      const existing = await prisma.twincidence.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('Twincidence not found');
      }

      // Only creator can update manual twincidences
      if (existing.eventType === 'manual' && existing.createdBy !== userId) {
        throw new Error('Only the creator can update this twincidence');
      }

      const updated = await prisma.twincidence.update({
        where: { id },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.description && { description: data.description }),
          ...(data.photos && { photos: JSON.stringify(data.photos) }),
          ...(data.isSpecial !== undefined && { isSpecial: data.isSpecial }),
          ...(data.severity && { severity: data.severity }),
        },
      });

      logger.info(`Twincidence updated: ${id}`);
      return this.formatTwincidence(updated);
    } catch (error) {
      logger.error('Error updating twincidence:', error);
      throw error;
    }
  }

  /**
   * Delete a twincidence (soft delete)
   */
  async deleteTwincidence(id: string, userId: string) {
    try {
      const existing = await prisma.twincidence.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('Twincidence not found');
      }

      // Only creator can delete
      if (existing.createdBy !== userId) {
        throw new Error('Only the creator can delete this twincidence');
      }

      await prisma.twincidence.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      logger.info(`Twincidence deleted: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting twincidence:', error);
      throw error;
    }
  }

  /**
   * Record a twintuition button press and check for simultaneity
   */
  async recordTwintuitionPress(data: TwintuitionPressData) {
    try {
      const { userId, twinPairId, pressTime } = data;

      // Get the twin pair
      const twinPair = await prisma.twinPair.findUnique({
        where: { id: twinPairId },
      });

      if (!twinPair) {
        throw new Error('Twin pair not found');
      }

      // Determine which user is pressing
      const isUser1 = twinPair.user1Id === userId;
      const twinUserId = isUser1 ? twinPair.user2Id : twinPair.user1Id;

      // Look for recent presses from the twin (within last 5 seconds)
      const fiveSecondsAgo = new Date(pressTime.getTime() - 5000);

      const recentPresses = await prisma.twincidence.findMany({
        where: {
          twinPairId,
          eventType: 'simultaneous_twintuition',
          createdAt: { gte: fiveSecondsAgo },
          OR: [
            { user1EventTime: { not: null }, user2EventTime: null },
            { user1EventTime: null, user2EventTime: { not: null } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      if (recentPresses.length > 0) {
        const recentPress = recentPresses[0];

        // Calculate time difference
        const otherPressTime = isUser1
          ? recentPress.user2EventTime
          : recentPress.user1EventTime;

        if (otherPressTime) {
          const timeDiff = Math.abs(
            pressTime.getTime() - otherPressTime.getTime()
          );

          // If within 3 seconds, it's simultaneous!
          if (timeDiff <= 3000) {
            // Update the existing press with both times
            const updated = await prisma.twincidence.update({
              where: { id: recentPress.id },
              data: {
                ...(isUser1
                  ? { user1EventTime: pressTime }
                  : { user2EventTime: pressTime }),
                timeDifference: timeDiff,
                sharedWithTwin: true, // Simultaneous = shared
              },
            });

            logger.info(
              `Simultaneous twintuition detected! Time diff: ${timeDiff}ms`
            );
            return {
              simultaneous: true,
              timeDifference: timeDiff,
              twincidence: this.formatTwincidence(updated),
            };
          }
        }
      }

      // No simultaneous press found, create a pending press
      const pendingPress = await prisma.twincidence.create({
        data: {
          twinPairId,
          createdBy: null, // Auto-detected
          title: 'Twintuition Alert',
          description: 'One twin sent a twintuition signal',
          eventType: 'simultaneous_twintuition',
          detectionMethod: 'server_side',
          ...(isUser1
            ? { user1EventTime: pressTime }
            : { user2EventTime: pressTime }),
          sharedWithTwin: false, // Not shared until simultaneous
        },
      });

      return {
        simultaneous: false,
        pendingPressId: pendingPress.id,
      };
    } catch (error) {
      logger.error('Error recording twintuition press:', error);
      throw error;
    }
  }

  /**
   * Export all twincidences for a user as JSON
   */
  async exportTwincidences(userId: string) {
    try {
      // Get all twin pairs for this user
      const twinPairs = await prisma.twinPair.findMany({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
      });

      const twinPairIds = twinPairs.map((tp) => tp.id);

      const twincidences = await prisma.twincidence.findMany({
        where: {
          twinPairId: { in: twinPairIds },
          OR: [
            { sharedWithTwin: true },
            { createdBy: userId },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      return twincidences.map((t) => this.formatTwincidence(t));
    } catch (error) {
      logger.error('Error exporting twincidences:', error);
      throw error;
    }
  }

  /**
   * Delete all twincidences for a user (soft delete)
   */
  async deleteAllTwincidences(userId: string) {
    try {
      // Get all twin pairs for this user
      const twinPairs = await prisma.twinPair.findMany({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
      });

      const twinPairIds = twinPairs.map((tp) => tp.id);

      // Only delete twincidences created by this user
      const result = await prisma.twincidence.updateMany({
        where: {
          twinPairId: { in: twinPairIds },
          createdBy: userId,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      logger.info(`Deleted ${result.count} twincidences for user ${userId}`);
      return { count: result.count };
    } catch (error) {
      logger.error('Error deleting all twincidences:', error);
      throw error;
    }
  }

  /**
   * Check if both users in a twin pair have consented to share an event type
   */
  private async checkDualConsent(
    twinPairId: string,
    eventType: string
  ): Promise<boolean> {
    try {
      const twinPair = await prisma.twinPair.findUnique({
        where: { id: twinPairId },
      });

      if (!twinPair) {
        return false;
      }

      // Get consent for both users
      const consents = await prisma.twincidenceConsent.findMany({
        where: {
          userId: { in: [twinPair.user1Id, twinPair.user2Id] },
          eventType,
          revokedAt: null,
        },
      });

      // Both must have consent level 'B' (share_with_twin)
      const user1Consent = consents.find((c) => c.userId === twinPair.user1Id);
      const user2Consent = consents.find((c) => c.userId === twinPair.user2Id);

      return (
        user1Consent?.consentLevel === 'B' &&
        user2Consent?.consentLevel === 'B'
      );
    } catch (error) {
      logger.error('Error checking dual consent:', error);
      return false;
    }
  }

  /**
   * Format twincidence for response (parse JSON fields)
   */
  private formatTwincidence(twincidence: any) {
    return {
      ...twincidence,
      photos: twincidence.photos ? JSON.parse(twincidence.photos) : [],
      eventData: twincidence.eventData
        ? JSON.parse(twincidence.eventData)
        : null,
      anonymizedData: twincidence.anonymizedData
        ? JSON.parse(twincidence.anonymizedData)
        : null,
    };
  }
}

export const twincidencesService = new TwincidencesService();
