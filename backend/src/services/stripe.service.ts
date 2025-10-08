import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
  typescript: true,
});

export interface CreateCustomerParams {
  userId: string;
  email: string;
  name?: string;
}

export interface CreateCheckoutSessionParams {
  userId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  trialDays?: number;
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  priceId?: string;
  cancelAtPeriodEnd?: boolean;
}

/**
 * Stripe Service
 * Handles all Stripe payment processing and subscription management
 */
export class StripeService {
  /**
   * Create or retrieve a Stripe customer
   */
  async createCustomer(params: CreateCustomerParams): Promise<string> {
    try {
      // Check if customer already exists
      const existingCustomer = await prisma.stripeCustomer.findUnique({
        where: { userId: params.userId },
      });

      if (existingCustomer) {
        return existingCustomer.stripeCustomerId;
      }

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: params.email,
        metadata: {
          userId: params.userId,
          name: params.name || '',
        },
      });

      // Store in database
      await prisma.stripeCustomer.create({
        data: {
          userId: params.userId,
          stripeCustomerId: customer.id,
          email: params.email,
        },
      });

      logger.info(`Created Stripe customer: ${customer.id} for user: ${params.userId}`);
      return customer.id;
    } catch (error) {
      logger.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create Stripe customer');
    }
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
    try {
      // Get or create customer
      const user = await prisma.stripeCustomer.findUnique({
        where: { userId: params.userId },
      });

      if (!user) {
        throw new Error('Customer not found');
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: user.stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        subscription_data: params.trialDays
          ? {
              trial_period_days: params.trialDays,
            }
          : undefined,
        metadata: {
          userId: params.userId,
        },
      });

      logger.info(`Created checkout session: ${session.id} for user: ${params.userId}`);
      return session;
    } catch (error) {
      logger.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Create a customer portal session
   */
  async createPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      logger.info(`Created portal session for customer: ${customerId}`);
      return session;
    } catch (error) {
      logger.error('Error creating portal session:', error);
      throw new Error('Failed to create portal session');
    }
  }

  /**
   * Create a subscription directly (without checkout)
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<Stripe.Subscription> {
    try {
      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: params.customerId,
        items: [{ price: params.priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      };

      if (params.trialDays) {
        subscriptionData.trial_period_days = params.trialDays;
      }

      const subscription = await stripe.subscriptions.create(subscriptionData);

      logger.info(`Created subscription: ${subscription.id} for customer: ${params.customerId}`);
      return subscription;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Update a subscription
   */
  async updateSubscription(params: UpdateSubscriptionParams): Promise<Stripe.Subscription> {
    try {
      const updateData: Stripe.SubscriptionUpdateParams = {};

      if (params.priceId) {
        const subscription = await stripe.subscriptions.retrieve(params.subscriptionId);
        updateData.items = [
          {
            id: subscription.items.data[0].id,
            price: params.priceId,
          },
        ];
      }

      if (params.cancelAtPeriodEnd !== undefined) {
        updateData.cancel_at_period_end = params.cancelAtPeriodEnd;
      }

      const subscription = await stripe.subscriptions.update(params.subscriptionId, updateData);

      logger.info(`Updated subscription: ${subscription.id}`);
      return subscription;
    } catch (error) {
      logger.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, immediately: boolean = false): Promise<Stripe.Subscription> {
    try {
      let subscription: Stripe.Subscription;

      if (immediately) {
        subscription = await stripe.subscriptions.cancel(subscriptionId);
      } else {
        subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }

      logger.info(`Canceled subscription: ${subscriptionId} (immediate: ${immediately})`);
      return subscription;
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Retrieve subscription details
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      logger.error('Error retrieving subscription:', error);
      throw new Error('Failed to retrieve subscription');
    }
  }

  /**
   * List customer subscriptions
   */
  async listCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 100,
      });
      return subscriptions.data;
    } catch (error) {
      logger.error('Error listing subscriptions:', error);
      throw new Error('Failed to list subscriptions');
    }
  }

  /**
   * Create a payment intent (for one-time payments)
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    customerId: string,
    description?: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        description,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      logger.info(`Created payment intent: ${paymentIntent.id} for customer: ${customerId}`);
      return paymentIntent;
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      logger.info(`Attached payment method: ${paymentMethodId} to customer: ${customerId}`);
      return paymentMethod;
    } catch (error) {
      logger.error('Error attaching payment method:', error);
      throw new Error('Failed to attach payment method');
    }
  }

  /**
   * Detach payment method from customer
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
      logger.info(`Detached payment method: ${paymentMethodId}`);
      return paymentMethod;
    } catch (error) {
      logger.error('Error detaching payment method:', error);
      throw new Error('Failed to detach payment method');
    }
  }

  /**
   * List customer payment methods
   */
  async listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      return paymentMethods.data;
    } catch (error) {
      logger.error('Error listing payment methods:', error);
      throw new Error('Failed to list payment methods');
    }
  }

  /**
   * Retrieve upcoming invoice
   */
  async getUpcomingInvoice(customerId: string): Promise<Stripe.UpcomingInvoice> {
    try {
      const invoice = await stripe.invoices.retrieveUpcoming({
        customer: customerId,
      });
      return invoice;
    } catch (error) {
      logger.error('Error retrieving upcoming invoice:', error);
      throw new Error('Failed to retrieve upcoming invoice');
    }
  }

  /**
   * Construct webhook event from raw body and signature
   */
  constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      return event;
    } catch (error) {
      logger.error('Error constructing webhook event:', error);
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Sync subscription to database
   */
  async syncSubscriptionToDatabase(subscription: Stripe.Subscription): Promise<void> {
    try {
      const customerId = typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id;

      const customer = await prisma.stripeCustomer.findUnique({
        where: { stripeCustomerId: customerId },
      });

      if (!customer) {
        logger.warn(`Customer not found for subscription sync: ${customerId}`);
        return;
      }

      const priceId = subscription.items.data[0]?.price.id;
      const productId = typeof subscription.items.data[0]?.price.product === 'string'
        ? subscription.items.data[0]?.price.product
        : subscription.items.data[0]?.price.product?.id;

      const currentPeriodStart = (subscription as any).current_period_start
        ? new Date(((subscription as any).current_period_start as number) * 1000)
        : new Date();
      const currentPeriodEnd = (subscription as any).current_period_end
        ? new Date(((subscription as any).current_period_end as number) * 1000)
        : new Date();

      await prisma.subscription.upsert({
        where: { stripeSubscriptionId: subscription.id },
        create: {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          stripeProductId: productId || '',
          status: subscription.status,
          tier: 'premium', // Map from product ID in production
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
          canceledAt: subscription.canceled_at ? new Date((subscription.canceled_at as number) * 1000) : null,
          trialStart: subscription.trial_start ? new Date((subscription.trial_start as number) * 1000) : null,
          trialEnd: subscription.trial_end ? new Date((subscription.trial_end as number) * 1000) : null,
        },
        update: {
          status: subscription.status,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
          canceledAt: subscription.canceled_at ? new Date((subscription.canceled_at as number) * 1000) : null,
          lastSyncedAt: new Date(),
        },
      });

      logger.info(`Synced subscription to database: ${subscription.id}`);
    } catch (error) {
      logger.error('Error syncing subscription to database:', error);
      throw error;
    }
  }
}

export default new StripeService();
