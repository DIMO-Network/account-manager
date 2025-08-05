'use server';

import { getUser } from '@/libs/DAL';
import { updateSessionData } from '@/libs/Session';
import { stripe } from '@/libs/Stripe';

export async function getOrCreateStripeCustomer(): Promise<{
  success: boolean;
  customerId?: string;
  error?: string;
}> {
  try {
    const user = await getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const userEmail = user.email;

    // Check if we already have a customer ID stored in session
    const existingCustomerId: string | undefined = user.stripeCustomerId;

    if (existingCustomerId) {
      // Verify the customer still exists in Stripe
      try {
        await stripe().customers.retrieve(existingCustomerId);
        return { success: true, customerId: existingCustomerId };
      } catch (error) {
        console.warn('Stored customer ID not found in Stripe, will create new one:', error);
      }
    }

    // Search for existing customer by email
    const existingCustomers = await stripe().customers.search({
      query: `email:'${userEmail}'`,
      limit: 1,
    });

    let customerId: string;

    if (existingCustomers.data.length > 0) {
      // Use existing customer
      customerId = existingCustomers.data[0]!.id;
    } else {
      // Create new customer with unique request ID to prevent duplicates
      const requestId = `create_customer_${user.id}_${userEmail}`;
      const customer = await stripe().customers.create({
        email: userEmail,
        metadata: {
          userId: user.id,
          authType: 'dimoJWT',
        },
      }, {
        idempotencyKey: requestId,
      });
      customerId = customer.id;
    }

    // Store customer ID in session for future use
    await updateSessionData({ stripeCustomerId: customerId });

    return { success: true, customerId };
  } catch (error) {
    console.error('Error getting/creating Stripe customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
