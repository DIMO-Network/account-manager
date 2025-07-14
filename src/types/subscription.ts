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

// Backend subscription status types
export type DeviceInfo = {
  address: string;
  tokenId: number;
  tokenDID: string;
  serial: string;
  vehicle: {
    tokenId: number;
    definition: {
      make: string;
      model: string;
      year: number;
    };
  };
  claimedAt?: string;
  mintedAt?: string;
  manufacturer?: {
    name: string;
  };
  connection?: {
    name: string;
    mintedAt: string;
  };
};

export type SubscriptionStatusV2 = {
  device: DeviceInfo | null;
  status: string;
  new_status: string;
  plan: string | null;
  price: string | null;
  start_date: string;
  trial_end: string | null;
  next_renewal_date: string | null;
  ended_at: string | null;
  cancel_at: string | null;
};

export type AllSubscriptionStatusesResponse = SubscriptionStatusV2[];

export type StripeSubscription = Stripe.Subscription;
export type StripeSubscriptionSchedule = Stripe.SubscriptionSchedule;

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
