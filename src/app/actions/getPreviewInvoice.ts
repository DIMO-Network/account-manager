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

export async function getPreviewInvoice(
  subscriptionId: string,
  newPriceId: string,
): Promise<PreviewInvoice | null> {
  try {
    const subscription = await stripe().subscriptions.retrieve(subscriptionId, {
      expand: ['items.data'],
    });

    const subscriptionItemId = subscription.items.data[0]?.id;
    if (!subscriptionItemId) {
      return null;
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
