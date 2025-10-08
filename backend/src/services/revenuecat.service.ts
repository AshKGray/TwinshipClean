import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import axios from 'axios';

const prisma = new PrismaClient();

const REVENUECAT_API_URL = 'https://api.revenuecat.com/v1';
const REVENUECAT_API_KEY = process.env.REVENUECAT_API_KEY || '';

interface RevenueCatSubscriber {
  subscriber: {
    entitlements: Record<string, any>;
    subscriptions: Record<string, any>;
    original_app_user_id: string;
  };
}

/**
 * RevenueCat Service
 * Handles RevenueCat integration and syncing with Stripe
 */
export class RevenueCatService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = REVENUECAT_API_KEY;
    this.apiUrl = REVENUECAT_API_URL;
  }

  /**
   * Get subscriber information from RevenueCat
   */
  async getSubscriber(appUserId: string): Promise<RevenueCatSubscriber | null> {
    try {
      const response = await axios.get(`${this.apiUrl}/subscribers/${appUserId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.info(`Subscriber not found in RevenueCat: ${appUserId}`);
        return null;
      }
      logger.error('Error fetching RevenueCat subscriber:', error);
      throw new Error('Failed to fetch RevenueCat subscriber');
    }
  }

  /**
   * Sync subscription from RevenueCat to database
   */
  async syncSubscriptionFromRevenueCat(userId: string): Promise<void> {
    try {
      const subscriber = await this.getSubscriber(userId);

      if (!subscriber) {
        logger.info(`No RevenueCat subscriber found for user: ${userId}`);
        return;
      }

      // Check if user has active entitlements
      const entitlements = subscriber.subscriber.entitlements;
      const subscriptions = subscriber.subscriber.subscriptions;

      // Find premium entitlement
      const hasPremium = Object.values(entitlements).some(
        (entitlement: any) => entitlement.expires_date && new Date(entitlement.expires_date) > new Date()
      );

      if (hasPremium) {
        logger.info(`User ${userId} has active premium entitlement from RevenueCat`);

        // Get the active subscription details
        const activeSubscription = Object.entries(subscriptions).find(
          ([_, sub]: [string, any]) => sub.expires_date && new Date(sub.expires_date) > new Date()
        );

        if (activeSubscription) {
          const [productId, subDetails] = activeSubscription as [string, any];

          // Update or create subscription record
          const customer = await prisma.stripeCustomer.findUnique({
            where: { userId },
          });

          if (customer) {
            await prisma.subscription.upsert({
              where: { revenueCatId: productId },
              create: {
                stripeCustomerId: customer.stripeCustomerId,
                stripeSubscriptionId: `rc_${productId}_${Date.now()}`,
                stripePriceId: productId,
                stripeProductId: productId,
                status: 'active',
                tier: 'premium',
                currentPeriodStart: new Date(subDetails.purchase_date),
                currentPeriodEnd: new Date(subDetails.expires_date),
                revenueCatId: productId,
                lastSyncedAt: new Date(),
              },
              update: {
                status: 'active',
                currentPeriodEnd: new Date(subDetails.expires_date),
                lastSyncedAt: new Date(),
              },
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error syncing RevenueCat subscription:', error);
      throw error;
    }
  }

  /**
   * Sync Stripe subscription to RevenueCat
   */
  async syncToRevenueCat(userId: string, subscriptionData: any): Promise<void> {
    try {
      // RevenueCat automatically tracks purchases from mobile app
      // This method is for manual sync if needed
      logger.info(`Syncing subscription to RevenueCat for user: ${userId}`);

      // RevenueCat webhook will handle most of the sync automatically
      // This is a placeholder for any custom sync logic needed
    } catch (error) {
      logger.error('Error syncing to RevenueCat:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature from RevenueCat
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET || '';

      // RevenueCat uses HMAC SHA256 for webhook signatures
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', webhookSecret);
      const digest = hmac.update(payload).digest('hex');

      return digest === signature;
    } catch (error) {
      logger.error('Error verifying RevenueCat webhook signature:', error);
      return false;
    }
  }

  /**
   * Handle RevenueCat webhook event
   */
  async handleWebhookEvent(event: any): Promise<void> {
    try {
      const eventType = event.type;
      const appUserId = event.event.app_user_id;

      logger.info(`Processing RevenueCat webhook: ${eventType} for user: ${appUserId}`);

      switch (eventType) {
        case 'INITIAL_PURCHASE':
        case 'RENEWAL':
        case 'PRODUCT_CHANGE':
          await this.syncSubscriptionFromRevenueCat(appUserId);
          break;

        case 'CANCELLATION':
        case 'EXPIRATION':
          // Mark subscription as canceled
          const customer = await prisma.stripeCustomer.findUnique({
            where: { userId: appUserId },
          });

          if (customer) {
            await prisma.subscription.updateMany({
              where: {
                stripeCustomerId: customer.stripeCustomerId,
                status: 'active',
              },
              data: {
                status: 'canceled',
                canceledAt: new Date(),
              },
            });
          }
          break;

        case 'BILLING_ISSUE':
          logger.warn(`Billing issue for user: ${appUserId}`);
          break;

        default:
          logger.info(`Unhandled RevenueCat event type: ${eventType}`);
      }
    } catch (error) {
      logger.error('Error handling RevenueCat webhook:', error);
      throw error;
    }
  }

  /**
   * Check if user has active premium subscription from either Stripe or RevenueCat
   */
  async hasActivePremium(userId: string): Promise<boolean> {
    try {
      // Check database first
      const customer = await prisma.stripeCustomer.findUnique({
        where: { userId },
        include: {
          subscriptions: {
            where: {
              status: {
                in: ['active', 'trialing'],
              },
            },
          },
        },
      });

      if (customer && customer.subscriptions.length > 0) {
        return true;
      }

      // Check RevenueCat as fallback
      const subscriber = await this.getSubscriber(userId);
      if (!subscriber) {
        return false;
      }

      const hasActiveEntitlement = Object.values(subscriber.subscriber.entitlements).some(
        (entitlement: any) => entitlement.expires_date && new Date(entitlement.expires_date) > new Date()
      );

      return hasActiveEntitlement;
    } catch (error) {
      logger.error('Error checking premium status:', error);
      return false;
    }
  }
}

export default new RevenueCatService();
