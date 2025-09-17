import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getUser } from '@/libs/DAL';
import { stripe } from '@/libs/Stripe';

export async function GET(_request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const userEmail = user.email;

    // Check if we already have a customer ID stored in session
    const existingCustomerId: string | undefined = user.stripeCustomerId;

    if (existingCustomerId) {
      // Verify the customer still exists in Stripe
      try {
        await stripe().customers.retrieve(existingCustomerId);
        return NextResponse.json({ customerId: existingCustomerId });
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

    // Note: We don't update the session here to avoid cookie modification issues
    // The customer ID will be stored when the user performs an action that requires it

    return NextResponse.json({ customerId });
  } catch (error) {
    console.error('Error getting/creating Stripe customer:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
