import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSession } from '@/libs/Session';
import { stripe } from '@/libs/Stripe';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const subscriptions = await stripe().subscriptions.list({
      customer: customerId,
      limit: 100,
      status: 'all',
    });

    return NextResponse.json({ subscriptions: subscriptions.data });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}
