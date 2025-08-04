'use server';

import type Stripe from 'stripe';
import type { StripeCancellationFeedback } from '@/libs/StripeSubscriptionService';
import { currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { getOrCreateStripeCustomer } from '@/app/actions/getStripeCustomer';
import { stripe } from '@/libs/Stripe';
import { featureFlags } from '@/utils/FeatureFlags';
import { getBaseUrl } from '@/utils/Helpers';
import { SubscriptionService } from '@/utils/SubscriptionService';

type ActionResult<T>
  = | { success: true; data: T }
    | { success: false; error: string };

async function createDirectSubscription(
  customerId: string,
  paymentMethodId: string,
  priceId: string,
  connectionId: string,
  vehicleTokenId: number,
): Promise<ActionResult<{ subscriptionId: string; url: string; type: 'direct_subscription' }> | null> {
  try {
    const subscription = await stripe().subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'allow_incomplete',
      default_payment_method: paymentMethodId,
      metadata: {
        connectionId,
        connectionType: 'R1',
        vehicleTokenId,
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
          url: `${getBaseUrl()}/dashboard?subscription=success&subscription_id=${subscription.id}&connection_id=${connectionId}`,
          type: 'direct_subscription',
        },
      };
    }

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
                  url: `${getBaseUrl()}/dashboard?subscription=success&subscription_id=${subscription.id}&connection_id=${connectionId}`,
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
  connectionId: string,
  vehicleTokenId: number,
): Promise<ActionResult<{ sessionId: string; url: string; type: 'checkout' }>> {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    metadata: {
      connectionId,
      connectionType: 'R1',
      customerType: isNewCustomer ? 'new' : 'returning',
      vehicleTokenId,
    },
    subscription_data: {
      metadata: {
        connectionId,
        connectionType: 'R1',
        vehicleTokenId,
      },
    },
    success_url: `${getBaseUrl()}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}&connection_id=${connectionId}`,
    cancel_url: `${getBaseUrl()}/dashboard?subscription=cancelled`,
    billing_address_collection: isNewCustomer ? 'required' : 'auto',
  };

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
  connectionId: string,
  vehicleTokenId: number,
  priceId: string,
): Promise<ActionResult<{ subscriptionId?: string; sessionId?: string; url: string; type: 'direct_subscription' | 'checkout' }>> {
  try {
    if (!connectionId || !vehicleTokenId || !priceId) {
      return { success: false, error: 'Missing required fields' };
    }

    const customerResult = await getOrCreateStripeCustomer();
    if (!customerResult.success || !customerResult.customerId) {
      return { success: false, error: customerResult.error || 'Failed to get customer' };
    }

    const customerId = customerResult.customerId;

    const paymentMethods = await stripe().paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    const customer = await stripe().customers.retrieve(customerId);
    let hasDefaultPaymentMethod: string | undefined;

    if (customer && !customer.deleted) {
      hasDefaultPaymentMethod = customer.invoice_settings?.default_payment_method as string | undefined;
    }

    // Try direct subscription
    if (hasDefaultPaymentMethod && paymentMethods.data.length > 0) {
      const directResult = await createDirectSubscription(
        customerId,
        hasDefaultPaymentMethod,
        priceId,
        connectionId,
        vehicleTokenId,
      );

      if (directResult) {
        return directResult;
      }
    }

    // Fallback to checkout
    const isNewCustomer = paymentMethods.data.length === 0;
    return await createCheckoutSession(
      customerId,
      isNewCustomer,
      priceId,
      connectionId,
      vehicleTokenId,
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function createCheckoutActionV2(
  connectionId: string,
  vehicleTokenId: number,
  plan: 'monthly' | 'annual' = 'monthly',
): Promise<ActionResult<{ checkout_url: string }>> {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const dimoToken = user.privateMetadata?.dimoToken as string;
    if (!dimoToken) {
      return { success: false, error: 'DIMO authentication required' };
    }

    const backendUrl = `${featureFlags.backendApiUrl}/subscription/new-subscription-link`;

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dimoToken}`,
      },
      body: JSON.stringify({
        plan,
        connectionId,
        connectionType: 'R1',
        vehicleTokenId,
      }),
    });

    if (!backendResponse.ok) {
      const error = await backendResponse.json();
      throw new Error(error.message || `Backend API error: ${backendResponse.status}`);
    }

    const result = await backendResponse.json();

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/vehicles/[tokenId]', 'page');

    return {
      success: true,
      data: {
        checkout_url: result.checkout_url,
      },
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create checkout session',
    };
  }
}

export async function cancelSubscriptionAction(
  subscriptionId: string,
  cancellationDetails?: {
    feedback: StripeCancellationFeedback;
    comment?: string;
  },
): Promise<ActionResult<void>> {
  try {
    const result = await SubscriptionService.cancelSubscription(subscriptionId, cancellationDetails);
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

export async function cancelSubscriptionActionV2(
  subscriptionId: string,
  _cancellationDetails?: {
    feedback: StripeCancellationFeedback;
    comment?: string;
  },
): Promise<ActionResult<void>> {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const dimoToken = user.privateMetadata?.dimoToken as string;
    if (!dimoToken) {
      return { success: false, error: 'DIMO authentication required' };
    }

    const backendUrl = `${featureFlags.backendApiUrl}/subscription/cancel/${subscriptionId}`;

    // TODO: For V2 (backend proxy), send cancellation_details in the DELETE request
    const backendResponse = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${dimoToken}`,
      },
    });

    if (!backendResponse.ok) {
      const error = await backendResponse.json();
      throw new Error(error.message || 'Failed to cancel subscription');
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/vehicles/[tokenId]', 'page');

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel subscription',
    };
  }
}

export async function updateSubscriptionAction(
  subscriptionId: string,
  cancellationDetails?: {
    feedback: StripeCancellationFeedback;
    comment?: string;
  },
): Promise<ActionResult<void>> {
  try {
    const result = await SubscriptionService.updateSubscription(subscriptionId, cancellationDetails);
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/vehicles/[tokenId]', 'page');

    return result.success
      ? { success: true, data: undefined }
      : { success: false, error: result.error || 'Failed to update subscription' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function updateSubscriptionActionV2(
  subscriptionId: string,
  _cancellationDetails?: {
    feedback: StripeCancellationFeedback;
    comment?: string;
  },
): Promise<ActionResult<void>> {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const dimoToken = user.privateMetadata?.dimoToken as string;
    if (!dimoToken) {
      return { success: false, error: 'DIMO authentication required' };
    }

    const backendUrl = `${featureFlags.backendApiUrl}/subscription/update/${subscriptionId}`;

    // TODO: For V2 (backend proxy), send update details in the POST request
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dimoToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancel_at_period_end: true,
        cancellation_details: _cancellationDetails
          ? {
              feedback: _cancellationDetails.feedback,
              comment: _cancellationDetails.comment,
            }
          : undefined,
      }),
    });

    if (!backendResponse.ok) {
      const error = await backendResponse.json();
      throw new Error(error.message || 'Failed to update subscription');
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/vehicles/[tokenId]', 'page');

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update subscription',
    };
  }
}
