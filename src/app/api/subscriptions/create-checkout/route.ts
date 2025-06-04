import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/libs/Stripe';
import { getBaseUrl } from '@/utils/Helpers';

export async function POST(request: NextRequest) {
  try {
    const { serialNumber, userEmail, priceId } = await request.json();

    if (!serialNumber || !userEmail || !priceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Create or get customer
    let customer;
    const existingCustomers = await stripe.customers.search({
      query: `email:'${userEmail}'`,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          device_serial: serialNumber,
        },
      });
    }

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found or created' },
        { status: 400 },
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      metadata: {
        serial_number: serialNumber,
        device_type: 'R1',
      },
      subscription_data: {
        metadata: {
          serial_number: serialNumber,
          device_type: 'R1',
        },
      },
      success_url: `${getBaseUrl()}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}&serial=${serialNumber}`,
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
