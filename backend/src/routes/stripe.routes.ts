import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import stripeService from '../services/stripe.service';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/stripe/webhook
 * Stripe webhook endpoint for handling payment events
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];

  if (!signature || typeof signature !== 'string') {
    logger.warn('Missing Stripe signature header');
    return res.status(400).json({ error: 'Missing signature' });
  }

  try {
    // Construct the event from the webhook payload
    const event = stripeService.constructWebhookEvent(req.body, signature);

    // Log the event
    logger.info(`Received Stripe webhook: ${event.type}`, { eventId: event.id });

    // Store webhook event for processing
    await prisma.webhookEvent.create({
      data: {
        stripeEventId: event.id,
        eventType: event.type,
        eventData: JSON.stringify(event.data.object),
      },
    });

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await stripeService.syncSubscriptionToDatabase(subscription);
        logger.info(`Synced subscription: ${subscription.id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'canceled',
            canceledAt: new Date(),
          },
        });
        logger.info(`Canceled subscription: ${subscription.id}`);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id || '';

        await prisma.invoice.upsert({
          where: { stripeInvoiceId: invoice.id },
          create: {
            stripeCustomerId: customerId,
            stripeInvoiceId: invoice.id,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: 'paid',
            periodStart: new Date(invoice.period_start * 1000),
            periodEnd: new Date(invoice.period_end * 1000),
            paidAt: new Date(),
            hostedInvoiceUrl: invoice.hosted_invoice_url || null,
            invoicePdfUrl: invoice.invoice_pdf || null,
          },
          update: {
            status: 'paid',
            paidAt: new Date(),
          },
        });
        logger.info(`Processed paid invoice: ${invoice.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id || '';

        await prisma.invoice.upsert({
          where: { stripeInvoiceId: invoice.id },
          create: {
            stripeCustomerId: customerId,
            stripeInvoiceId: invoice.id,
            amount: invoice.amount_due,
            currency: invoice.currency,
            status: 'open',
            periodStart: new Date(invoice.period_start * 1000),
            periodEnd: new Date(invoice.period_end * 1000),
            attemptCount: invoice.attempt_count || 0,
            hostedInvoiceUrl: invoice.hosted_invoice_url || null,
            invoicePdfUrl: invoice.invoice_pdf || null,
          },
          update: {
            status: 'open',
            attemptCount: invoice.attempt_count || 0,
          },
        });
        logger.warn(`Invoice payment failed: ${invoice.id}`);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const customerId =
          typeof paymentIntent.customer === 'string' ? paymentIntent.customer : paymentIntent.customer?.id || '';

        if (customerId) {
          await prisma.paymentIntent.upsert({
            where: { stripePaymentIntentId: paymentIntent.id },
            create: {
              stripeCustomerId: customerId,
              stripePaymentIntentId: paymentIntent.id,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
              status: paymentIntent.status,
              description: paymentIntent.description || null,
              metadata: JSON.stringify(paymentIntent.metadata),
            },
            update: {
              status: paymentIntent.status,
            },
          });
        }
        logger.info(`Payment intent succeeded: ${paymentIntent.id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const customerId =
          typeof paymentIntent.customer === 'string' ? paymentIntent.customer : paymentIntent.customer?.id || '';

        if (customerId) {
          await prisma.paymentIntent.update({
            where: { stripePaymentIntentId: paymentIntent.id },
            data: {
              status: paymentIntent.status,
            },
          });
        }
        logger.warn(`Payment intent failed: ${paymentIntent.id}`);
        break;
      }

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    // Mark webhook as processed
    await prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    res.json({ received: true });
  } catch (error: any) {
    logger.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/create-checkout-session
 * Create a Stripe checkout session for subscription
 */
router.post('/create-checkout-session', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { priceId, successUrl, cancelUrl, trialDays } = req.body;

    if (!priceId || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const session = await stripeService.createCheckoutSession({
      userId,
      priceId,
      successUrl,
      cancelUrl,
      trialDays,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    logger.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/create-portal-session
 * Create a Stripe customer portal session
 */
router.post('/create-portal-session', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { returnUrl } = req.body;

    if (!returnUrl) {
      return res.status(400).json({ error: 'Missing returnUrl' });
    }

    const customer = await prisma.stripeCustomer.findUnique({
      where: { userId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const session = await stripeService.createPortalSession(customer.stripeCustomerId, returnUrl);

    res.json({ url: session.url });
  } catch (error: any) {
    logger.error('Error creating portal session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/create-customer
 * Create a Stripe customer
 */
router.post('/create-customer', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const customerId = await stripeService.createCustomer({ userId, email, name });

    res.json({ customerId });
  } catch (error: any) {
    logger.error('Error creating customer:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/subscriptions/status
 * Get user's subscription status
 */
router.get('/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const customer = await prisma.stripeCustomer.findUnique({
      where: { userId },
      include: {
        subscriptions: {
          where: {
            status: {
              in: ['active', 'trialing', 'past_due'],
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!customer || customer.subscriptions.length === 0) {
      return res.json({ hasActiveSubscription: false });
    }

    const activeSubscription = customer.subscriptions[0];

    res.json({
      hasActiveSubscription: true,
      subscription: {
        id: activeSubscription.stripeSubscriptionId,
        status: activeSubscription.status,
        tier: activeSubscription.tier,
        currentPeriodEnd: activeSubscription.currentPeriodEnd,
        cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
      },
    });
  } catch (error: any) {
    logger.error('Error getting subscription status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/cancel
 * Cancel a subscription
 */
router.post('/cancel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { immediately } = req.body;

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

    if (!customer || customer.subscriptions.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const subscription = customer.subscriptions[0];
    await stripeService.cancelSubscription(subscription.stripeSubscriptionId, immediately);

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Error canceling subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
