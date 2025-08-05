import type Stripe from 'stripe';
import type { BackendSubscription } from '@/types/subscription';
import { getDimoVehicleDetails } from '@/app/actions/getDimoVehicleDetails';
import { stripe } from '@/libs/Stripe';

// ============================================================================
// SHARED CONSTANTS
// ============================================================================

export const SUBSCRIPTION_INTERVALS = {
  MONTH: 'month',
  YEAR: 'year',
} as const;

export const SUBSCRIPTION_STATUSES = {
  ACTIVE: 'active',
  TRIALING: 'trialing',
  CANCELED: 'canceled',
} as const;

export const SUBSCRIPTION_TYPES = {
  MONTHLY: 'Monthly',
  ANNUALLY: 'Annually',
  N_A: 'N/A',
} as const;

export const STRIPE_CANCELLATION_FEEDBACK = {
  too_expensive: 'Too expensive',
  missing_features: 'Missing features',
  switched_service: 'Switched to different service',
  unused: 'Unused',
  customer_service: 'Customer service was less than expected',
  low_quality: 'Quality was less than expected',
  too_complex: 'Ease of use was less than expected',
  other: 'Other reason',
} as const;

export type StripeCancellationFeedback = keyof typeof STRIPE_CANCELLATION_FEEDBACK;

// ============================================================================
// SHARED UTILITY FUNCTIONS
// ============================================================================

export function formatPriceAmount(amountCents: number | null | undefined): string {
  if (!amountCents) {
    return 'N/A';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountCents / 100);
}

export function formatPriceWithInterval(amountCents: number | null | undefined, interval?: string): string {
  if (!amountCents) {
    return 'N/A';
  }
  const formatted = formatPriceAmount(amountCents);
  return interval ? `${formatted}/${interval}` : formatted;
}

export function getVehicleDisplay(vehicleInfo?: any, vehicleTokenId?: string): string {
  if (vehicleInfo?.definition) {
    const { year, make, model } = vehicleInfo.definition;
    return `${year} ${make} ${model}`;
  }
  return vehicleTokenId || 'Unknown Vehicle';
}

export async function withStripeErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Stripe operation failed',
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    console.error('Stripe operation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : errorMessage,
    };
  }
}

// ============================================================================
// STRIPE SUBSCRIPTION HELPERS
// ============================================================================

export async function fetchSubscriptionWithSchedule(subscriptionId: string): Promise<{
  subscription: Stripe.Subscription;
  vehicleInfo?: any;
  nextScheduledPrice: Stripe.Price | null;
  nextScheduledDate: number | null;
}> {
  const subscription = await stripe().subscriptions.retrieve(subscriptionId, {
    expand: ['schedule', 'items.data.price.product'],
  });

  // Serialize the subscription object to a plain object for Client Components
  const subscriptionData = JSON.parse(JSON.stringify(subscription)) as Stripe.Subscription;

  // Get vehicleTokenId from subscription metadata
  const vehicleTokenId = subscription?.metadata?.vehicleTokenId;
  let vehicleInfo: any = null;
  if (vehicleTokenId) {
    const { vehicle } = await getDimoVehicleDetails(vehicleTokenId);
    vehicleInfo = vehicle;
  }

  // Get scheduled price information using shared function
  const { nextScheduledPrice, nextScheduledDate } = await getScheduledPriceInfo(subscriptionData);

  return {
    subscription: subscriptionData,
    vehicleInfo: vehicleInfo || undefined,
    nextScheduledPrice,
    nextScheduledDate,
  };
}

export async function getScheduledPriceInfo(subscription: Stripe.Subscription): Promise<{
  nextScheduledPrice: Stripe.Price | null;
  nextScheduledDate: number | null;
}> {
  let nextScheduledPrice: Stripe.Price | null = null;
  let nextScheduledDate: number | null = null;

  const schedule = subscription.schedule as Stripe.SubscriptionSchedule | null;
  if (schedule && schedule.phases && Array.isArray(schedule.phases) && schedule.phases.length > 0) {
    const now = Math.floor(Date.now() / 1000);

    // For trial subscriptions, we want to show the price that will be active after the trial
    // Find the next phase that will be active (not the current trial phase)
    const nextPhase = schedule.phases.find((phase: Stripe.SubscriptionSchedule.Phase) => phase.start_date > now);

    if (nextPhase && nextPhase.items && nextPhase.items.length > 0) {
      nextScheduledDate = nextPhase.start_date;
      const nextPriceId = nextPhase.items[0]?.price;
      if (nextPriceId && typeof nextPriceId === 'string') {
        const result = await withStripeErrorHandling(
          () => stripe().prices.retrieve(nextPriceId),
          'Failed to fetch next scheduled price',
        );
        if (result.success && result.data) {
          nextScheduledPrice = result.data;
        }
      }
    }
  }

  return {
    nextScheduledPrice: nextScheduledPrice ? JSON.parse(JSON.stringify(nextScheduledPrice)) : null,
    nextScheduledDate,
  };
}

export function getSubscriptionType(subscription: Stripe.Subscription): {
  type: string;
  interval: string | undefined;
} {
  const interval = subscription.items?.data?.[0]?.price?.recurring?.interval;

  let type: string = SUBSCRIPTION_TYPES.N_A;
  if (interval === SUBSCRIPTION_INTERVALS.MONTH) {
    type = SUBSCRIPTION_TYPES.MONTHLY;
  } else if (interval === SUBSCRIPTION_INTERVALS.YEAR) {
    type = SUBSCRIPTION_TYPES.ANNUALLY;
  }

  return { type, interval };
}

export function getSubscriptionTypeWithTranslation(subscription: Stripe.Subscription, t: (key: string) => string): {
  type: string;
  interval: string | undefined;
} {
  const interval = subscription.items?.data?.[0]?.price?.recurring?.interval;

  let type: string = SUBSCRIPTION_TYPES.N_A;
  if (interval === SUBSCRIPTION_INTERVALS.MONTH) {
    type = t('monthly');
  } else if (interval === SUBSCRIPTION_INTERVALS.YEAR) {
    type = t('annually');
  }

  return { type, interval };
}

export function getSubscriptionTypeAndPrice(
  subscription: Stripe.Subscription,
  nextScheduledPrice?: Stripe.Price | null,
) {
  // For trial subscriptions, prioritize showing the scheduled price that will be active after trial
  // If there's a scheduled price change, use that instead of current price
  if (nextScheduledPrice) {
    const scheduledInterval = nextScheduledPrice.recurring?.interval;
    const scheduledPriceCents = nextScheduledPrice.unit_amount;

    let type: string = SUBSCRIPTION_TYPES.N_A;
    if (scheduledInterval === SUBSCRIPTION_INTERVALS.MONTH) {
      type = SUBSCRIPTION_TYPES.MONTHLY;
    } else if (scheduledInterval === SUBSCRIPTION_INTERVALS.YEAR) {
      type = SUBSCRIPTION_TYPES.ANNUALLY;
    }

    const priceFormatted = formatPriceAmount(scheduledPriceCents);
    return {
      type,
      priceFormatted,
      displayText: `${type}${priceFormatted ? ` (${priceFormatted})` : ''}`,
      isScheduled: true,
    };
  }

  // Fall back to current subscription price
  const { type } = getSubscriptionType(subscription);
  const priceCents = subscription.items?.data?.[0]?.price?.unit_amount;

  const priceFormatted = formatPriceAmount(priceCents);

  return {
    type,
    priceFormatted,
    displayText: `${type}${priceFormatted ? ` (${priceFormatted})` : ''}`,
    isScheduled: false,
  };
}

export function getCancellationFeedbackLabel(feedback: StripeCancellationFeedback): string {
  return STRIPE_CANCELLATION_FEEDBACK[feedback];
}

// ============================================================================
// BACKEND SUBSCRIPTION HELPERS
// ============================================================================

export async function fetchBackendSubscriptions(dimoToken: string): Promise<BackendSubscription[] | null> {
  try {
    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/subscription/status/all`;
    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${dimoToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch backend data:', response.status, response.statusText, errorText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching backend subscription statuses:', error);
    return null;
  }
}

export async function checkUserOwnsSubscription(subscriptionId: string, dimoToken: string): Promise<boolean> {
  try {
    const userSubscriptions = await fetchBackendSubscriptions(dimoToken);

    if (!userSubscriptions) {
      return false;
    }

    // Check if the subscription ID exists in the user's subscriptions
    return userSubscriptions.some(sub => sub.stripe_id === subscriptionId);
  } catch (error) {
    console.error('Error checking subscription ownership:', error);
    return false;
  }
}

// Simple authorization function that accepts user info as parameters
export async function authorizeSubscriptionAccess(subscriptionId: string, dimoToken: string | null, jwtToken?: string | null): Promise<{ authorized: boolean; error?: string }> {
  try {
    // Try DIMO token first (from user metadata)
    if (dimoToken) {
      const userOwnsSubscription = await checkUserOwnsSubscription(subscriptionId, dimoToken);
      if (userOwnsSubscription) {
        return { authorized: true };
      }
    }

    // Try JWT token from cookies (for URL passthrough authentication)
    if (jwtToken) {
      const userOwnsSubscription = await checkUserOwnsSubscription(subscriptionId, jwtToken);
      if (userOwnsSubscription) {
        return { authorized: true };
      }
    }

    // If neither token worked, user doesn't own the subscription
    if (!dimoToken && !jwtToken) {
      return { authorized: false, error: 'DIMO authentication required' };
    }

    return { authorized: false, error: 'Subscription not found' };
  } catch (error) {
    console.error('Error in subscription authorization:', error);
    return { authorized: false, error: 'Authorization failed' };
  }
}
