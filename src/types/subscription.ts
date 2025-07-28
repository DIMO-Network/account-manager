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
  serial?: string;
  vehicle: {
    tokenId: number;
    definition: {
      make: string;
      model: string;
      year: number;
    };
  } | null;
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

export type BackendSubscription = {
  stripe_id?: string | null;
  device: DeviceInfo | null;
  status: string;
  new_status: string;
  plan: string | null;
  price: number | null;
  start_date: string;
  trial_end: string | null;
  next_renewal_date: string | null;
  ended_at: string | null;
  cancel_at: string | null;
};

export type StripeSubscription = Stripe.Subscription;
export type StripeSubscriptionSchedule = Stripe.SubscriptionSchedule;

// Helper type for active subscription statuses
export const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing'] as const;
export type ActiveSubscriptionStatus = typeof ACTIVE_SUBSCRIPTION_STATUSES[number];
