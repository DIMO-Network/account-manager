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
  customer_service: 'Customer service was less than expected',
  low_quality: 'Quality was less than expected',
  missing_features: 'Some features are missing',
  other: 'Other reason',
  switched_service: 'I\'m switching to a different service',
  too_complex: 'Ease of use was less than expected',
  too_expensive: 'It\'s too expensive',
  unused: 'I don\'t use the service enough',
} as const;

export type StripeCancellationFeedback = keyof typeof STRIPE_CANCELLATION_FEEDBACK;

export type StripeEnhancedSubscription = Stripe.Subscription & {
  productName: string;
  vehicleDisplay: string;
  nextScheduledPrice?: Stripe.Price | null;
  nextScheduledDate?: number | null;
};

// ============================================================================
// SHARED UTILITY FUNCTIONS
// ============================================================================

export function formatPriceAmount(amountCents: number | null | undefined): string {
  if (typeof amountCents === 'number') {
    return `$${(amountCents / 100).toFixed(2)}`;
  }
  return '';
}

export function formatPriceWithInterval(amountCents: number | null | undefined, interval?: string): string {
  const formattedAmount = formatPriceAmount(amountCents);
  if (!formattedAmount) {
    return '';
  }

  const intervalSuffix = interval === 'month' ? '/month' : interval === 'year' ? '/year' : '';
  return `${formattedAmount}${intervalSuffix}`;
}

export function getVehicleDisplay(vehicleInfo?: any, vehicleTokenId?: string): string {
  if (vehicleInfo?.definition?.year && vehicleInfo?.definition?.make && vehicleInfo?.definition?.model) {
    return `${vehicleInfo.definition.year} ${vehicleInfo.definition.make} ${vehicleInfo.definition.model}`;
  }
  return vehicleTokenId || 'N/A';
}

export async function withStripeErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Stripe operation failed',
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    console.error(errorMessage, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// STRIPE SUBSCRIPTION HELPERS
// ============================================================================

async function getProductInfo(productId: string): Promise<{ name: string } | null> {
  try {
    const product = await stripe().products.retrieve(productId);
    return { name: product.name };
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function fetchStripeSubscriptions(customerId: string): Promise<StripeEnhancedSubscription[]> {
  const subs = await stripe().subscriptions.list({
    customer: customerId,
    expand: ['data.items.data.price'],
  });

  const enhancedSubscriptions = await Promise.all(
    subs.data.map(async (sub) => {
      // Fetch each subscription individually to get schedule data
      const fullSubscription = await stripe().subscriptions.retrieve(sub.id, {
        expand: ['schedule'],
      });

      const itemsWithProducts = await Promise.all(
        fullSubscription.items.data.map(async (item) => {
          const productId = typeof item.price.product === 'string'
            ? item.price.product
            : item.price.product?.id;

          const productInfo = productId ? await getProductInfo(productId) : null;

          return {
            ...item,
            price: {
              ...item.price,
              product: productInfo,
            },
          };
        }),
      );

      return {
        ...fullSubscription,
        items: {
          ...fullSubscription.items,
          data: itemsWithProducts,
        },
      };
    }),
  );

  // Get vehicle information and scheduled price information for each subscription
  const subscriptionsWithVehicles = await Promise.all(
    enhancedSubscriptions.map(async (sub) => {
      const vehicleTokenId = sub.metadata?.vehicleTokenId;
      let vehicleInfo: any = null;

      if (vehicleTokenId) {
        const result = await getDimoVehicleDetails(vehicleTokenId);
        vehicleInfo = result.success ? result.vehicle : null;
      }

      const { nextScheduledPrice, nextScheduledDate } = await getScheduledPriceInfo(sub as unknown as Stripe.Subscription);

      return {
        ...sub,
        vehicleInfo,
        nextScheduledPrice,
        nextScheduledDate,
      };
    }),
  );

  const simplifiedSubscriptions = subscriptionsWithVehicles.map(sub => ({
    ...sub,
    productName: sub.items?.data?.[0]?.price?.product?.name || `Subscription ${sub.id}`,
    vehicleDisplay: getVehicleDisplay(sub.vehicleInfo, sub.metadata?.vehicleTokenId),
    nextScheduledPrice: sub.nextScheduledPrice,
    nextScheduledDate: sub.nextScheduledDate,
  }));

  return simplifiedSubscriptions as unknown as StripeEnhancedSubscription[];
}

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
