import type { PaymentMethodsResponse } from '@/types/paymentMethod';
import { currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/libs/Stripe';

export async function getPaymentMethods(customerId: string): Promise<PaymentMethodsResponse> {
  const user = await currentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const paymentMethods = await stripe().paymentMethods.list({
    customer: customerId,
    type: 'card',
    limit: 100,
  });

  // Fetch customer's default payment method
  const customer = await stripe().customers.retrieve(customerId);
  let defaultPaymentMethodId: string | null = null;

  // Type guard to check if customer is not deleted
  if (customer && !customer.deleted) {
    const defaultPaymentMethod = customer.invoice_settings?.default_payment_method;
    if (defaultPaymentMethod) {
      defaultPaymentMethodId = typeof defaultPaymentMethod === 'string'
        ? defaultPaymentMethod
        : defaultPaymentMethod.id;
    }
  }

  return {
    paymentMethods: paymentMethods.data,
    defaultPaymentMethodId,
  };
}
