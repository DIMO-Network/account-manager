'use server';

import { clerkClient, currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/libs/Stripe';

export async function getOrCreateStripeCustomer(): Promise<{
  success: boolean;
  customerId?: string;
  error?: string;
}> {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    if (!user.primaryEmailAddress?.emailAddress) {
      return { success: false, error: 'User email not found' };
    }

    const userEmail = user.primaryEmailAddress.emailAddress;

    // Check if we already have a customer ID stored
    const existingCustomerId: string | undefined = user.publicMetadata?.stripeCustomerId as string;

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
      // Create new customer
      const customer = await stripe().customers.create({
        email: userEmail,
        name: user.fullName || undefined,
        metadata: {
          user_id: user.id,
          auth_type: 'clerk',
        },
      });
      customerId = customer.id;
    }

    // Store customer ID in user's metadata
    const client = await clerkClient();
    await client.users.updateUserMetadata(user.id, {
      publicMetadata: {
        ...user.publicMetadata,
        stripeCustomerId: customerId,
      },
    });

    return { success: true, customerId };
  } catch (error) {
    console.error('Error getting/creating Stripe customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
