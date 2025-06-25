import type Stripe from 'stripe';

export type SubscriptionData = {
  hasActiveSubscription: boolean;
  subscription?: {
    id: string;
    status: string;
    planType: string;
  } | null;
  source: 'stripe' | 'local' | 'backend';
  error?: string;
};

export type StripeSubscription = Stripe.Subscription;

export type LocalSubscription = {
  id: number;
  connectionId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null;
  planType: string | null;
  isActive: boolean | null;
  updatedAt: Date;
  createdAt: Date;
};

// Helper type for active subscription statuses
export const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing'] as const;
export type ActiveSubscriptionStatus = typeof ACTIVE_SUBSCRIPTION_STATUSES[number];
