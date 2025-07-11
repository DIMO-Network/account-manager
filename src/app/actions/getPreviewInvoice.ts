import type Stripe from 'stripe';
import { stripe } from '@/libs/Stripe';

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

export async function getPreviewInvoice(
  subscriptionId: string,
  newPriceId: string,
): Promise<PreviewInvoice | ScheduledChangePreview | null> {
  try {
    const subscription = await stripe().subscriptions.retrieve(subscriptionId, {
      expand: ['items.data', 'items.data.price'],
    });

    const subscriptionItemId = subscription.items.data[0]?.id;
    if (!subscriptionItemId) {
      return null;
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
    const isTrialing = subscription.status === 'trialing';

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
