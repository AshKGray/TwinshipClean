import { prisma } from '../server';
import { logger } from '../utils/logger';

export type ConsentLevel = 'A' | 'B' | 'C';
// A = anonymous_research_only
// B = share_with_twin (requires dual consent)
// C = no_collection

export interface SetConsentData {
  userId: string;
  eventType: string;
  consentLevel: ConsentLevel;
}

export interface ConsentPreference {
  eventType: string;
  consentLevel: ConsentLevel;
  consentedAt: Date;
  updatedAt: Date;
  previousConsent?: string;
}

class ConsentService {
  /**
   * Set or update consent for a specific event type
   */
  async setConsent(data: SetConsentData) {
    try {
      const { userId, eventType, consentLevel } = data;

      // Validate consent level
      if (!['A', 'B', 'C'].includes(consentLevel)) {
        throw new Error('Invalid consent level. Must be A, B, or C.');
      }

      // Check if consent already exists
      const existing = await prisma.twincidenceConsent.findUnique({
        where: {
          userId_eventType: {
            userId,
            eventType,
          },
        },
      });

      if (existing) {
        // Update existing consent
        const updated = await prisma.twincidenceConsent.update({
          where: { id: existing.id },
          data: {
            consentLevel,
            previousConsent: existing.consentLevel,
            revokedAt: null, // Clear revocation if re-consenting
          },
        });

        logger.info(
          `Consent updated for user ${userId}, event ${eventType}: ${existing.consentLevel} → ${consentLevel}`
        );
        return this.formatConsent(updated);
      } else {
        // Create new consent
        const created = await prisma.twincidenceConsent.create({
          data: {
            userId,
            eventType,
            consentLevel,
          },
        });

        logger.info(
          `Consent created for user ${userId}, event ${eventType}: ${consentLevel}`
        );
        return this.formatConsent(created);
      }
    } catch (error) {
      logger.error('Error setting consent:', error);
      throw error;
    }
  }

  /**
   * Get all consent preferences for a user
   */
  async getUserConsents(userId: string): Promise<ConsentPreference[]> {
    try {
      const consents = await prisma.twincidenceConsent.findMany({
        where: {
          userId,
          revokedAt: null,
        },
        orderBy: {
          eventType: 'asc',
        },
      });

      return consents.map((c) => this.formatConsent(c));
    } catch (error) {
      logger.error('Error fetching user consents:', error);
      throw error;
    }
  }

  /**
   * Get consent for a specific event type
   */
  async getConsentForEvent(userId: string, eventType: string) {
    try {
      const consent = await prisma.twincidenceConsent.findUnique({
        where: {
          userId_eventType: {
            userId,
            eventType,
          },
        },
      });

      if (!consent || consent.revokedAt) {
        return null;
      }

      return this.formatConsent(consent);
    } catch (error) {
      logger.error('Error fetching event consent:', error);
      throw error;
    }
  }

  /**
   * Revoke consent for a specific event type
   */
  async revokeConsent(userId: string, eventType: string) {
    try {
      const consent = await prisma.twincidenceConsent.findUnique({
        where: {
          userId_eventType: {
            userId,
            eventType,
          },
        },
      });

      if (!consent) {
        throw new Error('Consent not found');
      }

      const revoked = await prisma.twincidenceConsent.update({
        where: { id: consent.id },
        data: {
          revokedAt: new Date(),
        },
      });

      logger.info(`Consent revoked for user ${userId}, event ${eventType}`);
      return this.formatConsent(revoked);
    } catch (error) {
      logger.error('Error revoking consent:', error);
      throw error;
    }
  }

  /**
   * Pause all detection for a user (set all to C temporarily)
   */
  async pauseAllDetection(userId: string) {
    try {
      // Get all active consents
      const consents = await prisma.twincidenceConsent.findMany({
        where: {
          userId,
          revokedAt: null,
        },
      });

      // Update all to 'C' (no collection) and store previous value
      const updates = consents.map((c) =>
        prisma.twincidenceConsent.update({
          where: { id: c.id },
          data: {
            previousConsent: c.consentLevel,
            consentLevel: 'C',
          },
        })
      );

      await prisma.$transaction(updates);

      logger.info(`All detection paused for user ${userId}`);
      return { pausedCount: consents.length };
    } catch (error) {
      logger.error('Error pausing detection:', error);
      throw error;
    }
  }

  /**
   * Resume detection (restore previous consent levels)
   */
  async resumeDetection(userId: string) {
    try {
      // Get all consents that were paused (have previousConsent)
      const pausedConsents = await prisma.twincidenceConsent.findMany({
        where: {
          userId,
          consentLevel: 'C',
          previousConsent: { not: null },
        },
      });

      // Restore previous consent levels
      const updates = pausedConsents.map((c) =>
        prisma.twincidenceConsent.update({
          where: { id: c.id },
          data: {
            consentLevel: c.previousConsent as ConsentLevel,
            previousConsent: null,
          },
        })
      );

      await prisma.$transaction(updates);

      logger.info(`Detection resumed for user ${userId}`);
      return { resumedCount: pausedConsents.length };
    } catch (error) {
      logger.error('Error resuming detection:', error);
      throw error;
    }
  }

  /**
   * Check dual consent between twins for an event type
   */
  async checkDualConsent(
    user1Id: string,
    user2Id: string,
    eventType: string
  ): Promise<{
    canShare: boolean;
    user1Level: ConsentLevel | null;
    user2Level: ConsentLevel | null;
  }> {
    try {
      const user1Consent = await this.getConsentForEvent(user1Id, eventType);
      const user2Consent = await this.getConsentForEvent(user2Id, eventType);

      const user1Level = user1Consent?.consentLevel || null;
      const user2Level = user2Consent?.consentLevel || null;

      // Both must be 'B' to share
      const canShare = user1Level === 'B' && user2Level === 'B';

      return {
        canShare,
        user1Level,
        user2Level,
      };
    } catch (error) {
      logger.error('Error checking dual consent:', error);
      return {
        canShare: false,
        user1Level: null,
        user2Level: null,
      };
    }
  }

  /**
   * Get consent statistics for a user
   */
  async getConsentStats(userId: string) {
    try {
      const consents = await prisma.twincidenceConsent.findMany({
        where: {
          userId,
          revokedAt: null,
        },
      });

      const stats = {
        total: consents.length,
        levelA: consents.filter((c) => c.consentLevel === 'A').length,
        levelB: consents.filter((c) => c.consentLevel === 'B').length,
        levelC: consents.filter((c) => c.consentLevel === 'C').length,
        allPaused: consents.every((c) => c.consentLevel === 'C'),
      };

      return stats;
    } catch (error) {
      logger.error('Error fetching consent stats:', error);
      throw error;
    }
  }

  /**
   * Export consent history for a user (for transparency/audit)
   */
  async exportConsentHistory(userId: string) {
    try {
      const history = await prisma.twincidenceConsent.findMany({
        where: { userId },
        orderBy: { consentedAt: 'desc' },
      });

      return history.map((c) => ({
        eventType: c.eventType,
        consentLevel: c.consentLevel,
        consentedAt: c.consentedAt,
        updatedAt: c.updatedAt,
        revokedAt: c.revokedAt,
        previousConsent: c.previousConsent,
      }));
    } catch (error) {
      logger.error('Error exporting consent history:', error);
      throw error;
    }
  }

  /**
   * Format consent for response
   */
  private formatConsent(consent: any): ConsentPreference {
    return {
      eventType: consent.eventType,
      consentLevel: consent.consentLevel,
      consentedAt: consent.consentedAt,
      updatedAt: consent.updatedAt,
      previousConsent: consent.previousConsent,
    };
  }
}

export const consentService = new ConsentService();
