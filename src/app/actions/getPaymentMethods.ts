import { getSession } from '@/libs/Session';
import { stripe } from '@/libs/Stripe';
import type { PaymentMethodsResponse } from '@/types/paymentMethod';

export async function getPaymentMethods(customerId: string): Promise<PaymentMethodsResponse> {
  const session = await getSession();
  if (!session) {
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
