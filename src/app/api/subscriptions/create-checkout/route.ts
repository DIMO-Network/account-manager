import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getOrCreateStripeCustomer } from '@/app/actions/getStripeCustomer';
import { stripe } from '@/libs/Stripe';
import { getBaseUrl } from '@/utils/Helpers';

export async function POST(request: NextRequest) {
  try {
    const { connectionId, priceId } = await request.json();

    if (!connectionId || !priceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Get or create customer using the server action
    const customerResult = await getOrCreateStripeCustomer();

    if (!customerResult.success || !customerResult.customerId) {
      return NextResponse.json(
        { error: customerResult.error || 'Failed to get customer' },
        { status: 400 },
      );
    }

    // Create checkout session
    const session = await stripe().checkout.sessions.create({
      customer: customerResult.customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      metadata: {
        connection_id: connectionId,
        device_type: 'R1',
      },
      subscription_data: {
        metadata: {
          connection_id: connectionId,
          device_type: 'R1',
        },
      },
      success_url: `${getBaseUrl()}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}&connection_id=${connectionId}`,
      cancel_url: `${getBaseUrl()}/dashboard?subscription=cancelled`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
