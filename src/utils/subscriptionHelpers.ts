import type Stripe from 'stripe';
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

export type EnhancedSubscription = Stripe.Subscription & {
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

export async function fetchEnhancedSubscriptions(customerId: string): Promise<EnhancedSubscription[]> {
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

  return simplifiedSubscriptions as unknown as EnhancedSubscription[];
}

export async function fetchSubscriptionWithSchedule(subscriptionId: string): Promise<{
  subscription: Stripe.Subscription;
  vehicleInfo?: any;
  nextScheduledPrice: Stripe.Price | null;
  nextScheduledDate: number | null;
}> {
  const subscription = await stripe().subscriptions.retrieve(subscriptionId, {
    expand: ['schedule'],
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
  if (schedule && schedule.phases && Array.isArray(schedule.phases) && schedule.phases.length > 1) {
    const now = Math.floor(Date.now() / 1000);
    const nextPhase = schedule.phases.find((phase: Stripe.SubscriptionSchedule.Phase) => phase.start_date > now);
    if (nextPhase) {
      nextScheduledDate = nextPhase.start_date;
      const nextPriceId = nextPhase.items?.[0]?.price;
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

export function getSubscriptionTypeAndPrice(subscription: Stripe.Subscription) {
  const { type } = getSubscriptionType(subscription);
  console.warn('subscription', subscription);
  const priceCents = subscription.items?.data?.[0]?.price?.unit_amount;

  const priceFormatted = formatPriceAmount(priceCents);

  return { type, priceFormatted, displayText: `${type}${priceFormatted ? ` (${priceFormatted})` : ''}` };
}

export function getCancellationFeedbackLabel(feedback: StripeCancellationFeedback): string {
  return STRIPE_CANCELLATION_FEEDBACK[feedback];
}
