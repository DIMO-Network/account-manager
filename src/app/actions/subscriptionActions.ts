'use server';

import type Stripe from 'stripe';
import { revalidatePath } from 'next/cache';
import { getOrCreateStripeCustomer } from '@/app/actions/getStripeCustomer';
import { stripe } from '@/libs/Stripe';
import { getBaseUrl } from '@/utils/Helpers';
import { SubscriptionService } from '@/utils/SubscriptionService';

type ActionResult<T>
  = | { success: true; data: T }
    | { success: false; error: string };

async function createDirectSubscription(
  customerId: string,
  paymentMethodId: string,
  priceId: string,
  serialNumber: string,
): Promise<ActionResult<{ subscriptionId: string; url: string; type: 'direct_subscription' }> | null> {
  try {
    const subscription = await stripe().subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'allow_incomplete',
      default_payment_method: paymentMethodId,
      metadata: {
        serial_number: serialNumber,
        device_type: 'R1',
      },
      expand: ['latest_invoice', 'latest_invoice.payment_intent'],
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice & {
      payment_intent?: Stripe.PaymentIntent;
    };

    if (subscription.status === 'active') {
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/vehicles/[tokenId]', 'page');

      return {
        success: true,
        data: {
          subscriptionId: subscription.id,
          url: `${getBaseUrl()}/dashboard?subscription=success&subscription_id=${subscription.id}&serial=${serialNumber}`,
          type: 'direct_subscription',
        },
      };
    }

    // Handle incomplete status using Stripe's actual status enum
    if (subscription.status === 'incomplete') {
      const paymentIntent = invoice?.payment_intent;

      if (paymentIntent?.status === 'requires_action' || paymentIntent?.status === 'requires_payment_method') {
        await stripe().subscriptions.cancel(subscription.id);
        return null;
      }

      // Try manual payment
      if (invoice?.id) {
        try {
          const paidInvoice = await stripe().invoices.pay(invoice.id, {
            payment_method: paymentMethodId,
          });

          if (paidInvoice.status === 'paid') {
            const updatedSub = await stripe().subscriptions.retrieve(subscription.id);
            if (updatedSub.status === 'active') {
              revalidatePath('/dashboard');
              revalidatePath('/dashboard/vehicles/[tokenId]', 'page');

              return {
                success: true,
                data: {
                  subscriptionId: subscription.id,
                  url: `${getBaseUrl()}/dashboard?subscription=success&subscription_id=${subscription.id}&serial=${serialNumber}`,
                  type: 'direct_subscription',
                },
              };
            }
          }
        } catch (payError) {
          console.warn('Manual payment failed:', payError);
        }
      }

      await stripe().subscriptions.cancel(subscription.id);
      return null;
    }

    return null;
  } catch (error) {
    console.error('Direct subscription failed:', error);
    return null;
  }
}

async function createCheckoutSession(
  customerId: string,
  isNewCustomer: boolean,
  priceId: string,
  serialNumber: string,
): Promise<ActionResult<{ sessionId: string; url: string; type: 'checkout' }>> {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    metadata: {
      serial_number: serialNumber,
      device_type: 'R1',
      customer_type: isNewCustomer ? 'new' : 'returning',
    },
    subscription_data: {
      metadata: {
        serial_number: serialNumber,
        device_type: 'R1',
      },
    },
    success_url: `${getBaseUrl()}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}&serial=${serialNumber}`,
    cancel_url: `${getBaseUrl()}/dashboard?subscription=cancelled`,
    billing_address_collection: isNewCustomer ? 'required' : 'auto',
  };

  if (isNewCustomer) {
    sessionParams.payment_intent_data = { setup_future_usage: 'off_session' };
  }

  const session = await stripe().checkout.sessions.create(sessionParams);

  return {
    success: true,
    data: {
      sessionId: session.id,
      url: session.url!,
      type: 'checkout',
    },
  };
}

export async function createCheckoutAction(
  serialNumber: string,
  priceId: string,
): Promise<ActionResult<{ subscriptionId?: string; sessionId?: string; url: string; type: 'direct_subscription' | 'checkout' }>> {
  try {
    if (!serialNumber || !priceId) {
      return { success: false, error: 'Missing required fields' };
    }

    const customerResult = await getOrCreateStripeCustomer();
    if (!customerResult.success || !customerResult.customerId) {
      return { success: false, error: customerResult.error || 'Failed to get customer' };
    }

    const customerId = customerResult.customerId;

    // Use Stripe's actual PaymentMethod list response
    const paymentMethods = await stripe().paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    // Use Stripe's Customer type directly
    const customer = await stripe().customers.retrieve(customerId);
    let hasDefaultPaymentMethod: string | undefined;

    if (customer && !customer.deleted) {
      hasDefaultPaymentMethod = customer.invoice_settings?.default_payment_method as string | undefined;
    }

    // [Payment method validation logic - same as before]

    // Try direct subscription
    if (hasDefaultPaymentMethod && paymentMethods.data.length > 0) {
      const directResult = await createDirectSubscription(
        customerId,
        hasDefaultPaymentMethod,
        priceId,
        serialNumber,
      );

      if (directResult) {
        return directResult;
      }
    }

    // Fallback to checkout
    const isNewCustomer = paymentMethods.data.length === 0;
    return await createCheckoutSession(customerId, isNewCustomer, priceId, serialNumber);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function cancelSubscriptionAction(
  subscriptionId: string,
): Promise<ActionResult<void>> {
  try {
    const result = await SubscriptionService.cancelSubscription(subscriptionId);
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/vehicles/[tokenId]', 'page');

    return result.success
      ? { success: true, data: undefined }
      : { success: false, error: result.error || 'Failed to cancel subscription' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
