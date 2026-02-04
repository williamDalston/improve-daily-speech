import Stripe from 'stripe';
import { db } from './db';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const PLANS = {
  PRO_MONTHLY: {
    priceId: process.env.STRIPE_PRICE_ID!,
    name: 'MindCast Pro',
    price: 19.99,
    interval: 'month',
    features: [
      'Unlimited episodes',
      'Full AI pipeline (4 enhancement stages)',
      'Sovereign Mind reflection lens',
      'Priority audio generation',
      'Export to all formats',
    ],
  },
  PRO_ANNUAL: {
    priceId: process.env.STRIPE_ANNUAL_PRICE_ID || process.env.STRIPE_PRICE_ID!, // Fallback to monthly if not set
    name: 'MindCast Pro (Annual)',
    price: 149.99,
    monthlyEquivalent: 12.50,
    savings: 90,
    interval: 'year',
    features: [
      'Unlimited episodes',
      'Full AI pipeline (4 enhancement stages)',
      'Sovereign Mind reflection lens',
      'Priority audio generation',
      'Export to all formats',
      '2 months free compared to monthly',
    ],
  },
} as const;

export type BillingInterval = 'month' | 'year';

export const FREE_EPISODE_LIMIT = 3;

/**
 * Check if user has access to create episodes
 */
export async function canCreateEpisode(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  episodesRemaining?: number;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      freeEpisodesUsed: true,
      subscriptionEndsAt: true,
    },
  });

  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  // Pro users have unlimited access
  if (user.subscriptionStatus === 'active') {
    return { allowed: true };
  }

  // Check grace period for canceled subscriptions
  if (
    user.subscriptionStatus === 'canceled' &&
    user.subscriptionEndsAt &&
    new Date() < user.subscriptionEndsAt
  ) {
    return { allowed: true };
  }

  // Free tier: check limit
  const remaining = FREE_EPISODE_LIMIT - user.freeEpisodesUsed;
  if (remaining > 0) {
    return { allowed: true, episodesRemaining: remaining };
  }

  return {
    allowed: false,
    reason: 'Free episode limit reached',
    episodesRemaining: 0,
  };
}

/**
 * Increment free episode usage
 */
export async function incrementFreeUsage(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { freeEpisodesUsed: { increment: 1 } },
  });
}

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  interval: BillingInterval = 'month'
): Promise<string> {
  // Get or create Stripe customer
  let user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  let customerId = user?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { userId },
    });
    customerId = customer.id;

    await db.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
  }

  // Select the appropriate plan based on interval
  const plan = interval === 'year' ? PLANS.PRO_ANNUAL : PLANS.PRO_MONTHLY;

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXTAUTH_URL}/library?upgraded=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
    metadata: { userId, interval },
  });

  return session.url!;
}

/**
 * Create Stripe billing portal session
 */
export async function createPortalSession(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    throw new Error('No Stripe customer found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL}/settings`,
  });

  return session.url;
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId) break;

      await db.user.update({
        where: { id: userId },
        data: {
          stripeSubscriptionId: session.subscription as string,
          subscriptionStatus: 'active',
        },
      });
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const user = await db.user.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (!user) break;

      await db.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: subscription.status,
          stripePriceId: subscription.items.data[0]?.price.id,
          subscriptionEndsAt: subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000)
            : null,
        },
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const user = await db.user.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (!user) break;

      await db.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: 'canceled',
          subscriptionEndsAt: new Date(),
        },
      });
      break;
    }
  }
}
