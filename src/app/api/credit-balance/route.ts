import type { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/libs/Stripe';

async function authenticateUser() {
  const user = await currentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
}

export async function GET(request: NextRequest) {
  try {
    await authenticateUser();

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 },
      );
    }

    const customer = await stripe().customers.retrieve(customerId);

    if (!customer || customer.deleted) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 },
      );
    }

    // Get customer's credit balance from the customer object
    // In Stripe, credits are negative values, but display them as positive
    const availableBalance = Math.abs(customer.balance || 0);
    const currency = customer.currency || 'usd';

    return NextResponse.json({
      available: availableBalance,
      currency,
    });
  } catch (error) {
    console.error('Error fetching credit balance:', error);
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch credit balance' },
      { status: 500 },
    );
  }
}
