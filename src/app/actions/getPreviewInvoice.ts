import { stripe } from '@/libs/Stripe';
import type Stripe from 'stripe';

export type PreviewInvoice = {
  id: string;
  total: number;
  currency: string;
  chargeDate?: number;
  prorationDate?: number;
  lines: {
    data: Stripe.InvoiceLineItem[];
  };
};

export type ScheduledChangePreview = {
  scheduledChange: true;
  nextInterval: string;
  nextAmount: number;
  nextDate: number;
};

export type CanceledTrialPreview = {
  canceledTrial: true;
  trialEndDate: number;
  nextAmount: number;
  nextInterval: string;
};

export type ScheduledSubscriptionPreview = {
  scheduledSubscription: true;
  nextAmount: number;
  nextInterval: string;
  nextDate: number;
};

export async function getPreviewInvoice(
  subscriptionId: string,
  newPriceId: string,
): Promise<PreviewInvoice | ScheduledChangePreview | CanceledTrialPreview | ScheduledSubscriptionPreview | null> {
  try {
    const subscription: Stripe.Subscription = await stripe().subscriptions.retrieve(subscriptionId, {
      expand: ['items.data', 'items.data.price', 'schedule'],
    });

    const subscriptionItemId = subscription.items.data[0]?.id;
    if (!subscriptionItemId) {
      return null;
    }

    // Check if subscription is managed by a schedule
    const existingSchedule = subscription.schedule as Stripe.SubscriptionSchedule | null;
    if (existingSchedule?.id) {
      // For subscriptions managed by schedules, we can't create preview invoices
      // Return scheduled subscription preview instead
      const newPrice = await stripe().prices.retrieve(newPriceId);
      const newAmount = newPrice?.unit_amount ?? 0;
      const newInterval = newPrice?.recurring?.interval ?? 'month';
      const currentPeriodEnd = subscription.items.data[0]?.current_period_end ?? 0;

      return {
        scheduledSubscription: true,
        nextAmount: newAmount,
        nextInterval: newInterval,
        nextDate: currentPeriodEnd,
      };
    }

    // Check if this is a canceled subscription with active trial
    const isCanceled = subscription.cancel_at !== null;
    const isTrialing = subscription.status === 'trialing';
    const isCanceledWithTrial = isCanceled && isTrialing;

    // For canceled subscriptions with active trials, return special preview
    if (isCanceledWithTrial) {
      const newPrice = await stripe().prices.retrieve(newPriceId);
      const newAmount = newPrice?.unit_amount ?? 0;
      const newInterval = newPrice?.recurring?.interval ?? 'month';

      return {
        canceledTrial: true,
        trialEndDate: subscription.trial_end ?? 0,
        nextAmount: newAmount,
        nextInterval: newInterval,
      };
    }

    // For canceled subscriptions that are not in trial, we can't create preview invoices
    // because they're scheduled for cancellation. However, if the user is changing to the same plan,
    // we should allow them to reactivate without charging.
    if (isCanceled) {
      const newPrice = await stripe().prices.retrieve(newPriceId);
      const newAmount = newPrice?.unit_amount ?? 0;
      const newInterval = newPrice?.recurring?.interval ?? 'month';
      const currentPriceId = subscription.items.data[0]?.price?.id;

      // If changing to the same price, this is a reactivation without charge
      if (newPriceId === currentPriceId) {
        return {
          scheduledChange: true,
          nextInterval: newInterval,
          nextAmount: newAmount,
          nextDate: subscription.items.data[0]?.current_period_end ?? 0,
        };
      }

      // If changing to a different price, show the cancellation date
      return {
        scheduledChange: true,
        nextInterval: newInterval,
        nextAmount: newAmount,
        nextDate: subscription.cancel_at ?? 0,
      };
    }

    // Determine current and new interval
    const currentInterval = subscription.items.data[0]?.price?.recurring?.interval;
    const currentPeriodEnd = subscription.items.data[0]?.current_period_end;
    const newPrice = await stripe().prices.retrieve(newPriceId);
    const newInterval = newPrice?.recurring?.interval;
    const newAmount = newPrice?.unit_amount ?? 0;

    // If switching from annual to monthly, return scheduled change info
    if (currentInterval === 'year' && newInterval === 'month') {
      return {
        scheduledChange: true,
        nextInterval: newInterval,
        nextAmount: newAmount,
        nextDate: currentPeriodEnd ?? 0,
      };
    }

    const prorationDate = Math.floor(Date.now() / 1000);

    const subscriptionDetails: any = {
      items: [
        {
          id: subscriptionItemId,
          price: newPriceId,
        },
      ],
    };
    if (!isTrialing) {
      subscriptionDetails.proration_date = prorationDate;
      subscriptionDetails.proration_behavior = 'create_prorations';
    }

    const preview: Stripe.Invoice = await stripe().invoices.createPreview({
      subscription: subscriptionId,
      subscription_details: subscriptionDetails,
      ...(isTrialing ? { preview_mode: 'recurring' } : {}),
    });

    return {
      id: preview.id ?? '',
      total: preview.total ?? 0,
      currency: preview.currency ?? '',
      chargeDate: preview.next_payment_attempt ?? undefined,
      prorationDate: prorationDate ?? undefined,
      lines: {
        data: preview.lines.data as Stripe.InvoiceLineItem[],
      },
    };
  } catch (error) {
    console.error('Error fetching preview invoice:', error);
    return null;
  }
}
