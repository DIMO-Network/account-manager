import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getUser } from '@/libs/DAL';
import { stripe } from '@/libs/Stripe';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get or find Stripe customer ID
    let customerId: string;

    if (user.stripeCustomerId) {
      customerId = user.stripeCustomerId;
    } else {
      // Search for existing customer by email
      const existingCustomers = await stripe().customers.search({
        query: `email:'${user.email}'`,
        limit: 1,
      });

      if (existingCustomers.data.length === 0) {
        console.error('No Stripe customer found for user:', user.id, 'email:', user.email);
        return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
      }

      customerId = existingCustomers.data[0]!.id;
    }

    const { amount, currency = 'usd', description, metadata } = await request.json();

    if (!amount || typeof amount !== 'number') {
      console.error('Invalid amount received:', { amount, type: typeof amount });
      return NextResponse.json({ error: 'Amount is required and must be a number' }, { status: 400 });
    }

    // Create a credit balance transaction (negative amount = credit to customer)
    const balanceTransaction = await stripe().customers.createBalanceTransaction(
      customerId,
      {
        amount: -Math.abs(amount), // Ensure negative amount for credit
        currency: currency.toLowerCase(),
        description: description || 'DIMO token conversion credit',
        metadata: {
          source: 'dimo_conversion',
          ...metadata,
        },
      },
    );

    return NextResponse.json({
      success: true,
      transactionId: balanceTransaction.id,
      amount: Math.abs(amount),
      currency: balanceTransaction.currency,
    });
  } catch (error) {
    console.error('Error adding credit balance:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add credit balance' },
      { status: 500 },
    );
  }
}
