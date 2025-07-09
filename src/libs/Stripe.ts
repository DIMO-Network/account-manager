import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export const stripe = (): Stripe => {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }

    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-06-30.basil',
    });
  }

  return stripeInstance;
};
