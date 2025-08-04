import { NextResponse } from 'next/server';
import { getSession } from '@/libs/Session';
import { fetchStripeSubscriptions } from '@/libs/StripeSubscriptionService';

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 },
      );
    }

    const subscriptions = await fetchStripeSubscriptions(customerId);

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching Stripe subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 },
    );
  }
}
