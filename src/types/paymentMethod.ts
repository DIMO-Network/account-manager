import type Stripe from 'stripe';

export type PaymentMethod = Stripe.PaymentMethod;

export type PaymentMethodsResponse = {
  paymentMethods: Stripe.PaymentMethod[];
  defaultPaymentMethodId?: string | null;
};
