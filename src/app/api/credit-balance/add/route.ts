import { getUser } from '@/libs/DAL';
import { stripe } from '@/libs/Stripe';
import { NextResponse } from 'next/server';
import type {
  CreditBalanceError,
  CreditBalanceRequest,
  CreditBalanceResponse,
  TransactionValidationError,
  TransactionValidationResponse,
} from '@/types/credit-balance';
import type { NextRequest } from 'next/server';

// API endpoint for adding credit balance from DIMO token conversions
// Requires a transaction hash to validate the blockchain transaction
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json<CreditBalanceError>({
        error: 'User not authenticated',
      }, { status: 401 });
    }

    const body: CreditBalanceRequest = await request.json();
    const { amount, currency = 'usd', description, metadata, txHash } = body;

    if (!amount || typeof amount !== 'number') {
      console.error('Invalid amount received:', { amount, type: typeof amount });
      return NextResponse.json<CreditBalanceError>({
        error: 'Amount is required and must be a number',
      }, { status: 400 });
    }

    // Transaction hash is required for DIMO token conversions
    if (!txHash) {
      return NextResponse.json<CreditBalanceError>({
        error: 'Transaction hash is required for DIMO token conversions',
      }, { status: 400 });
    }

    // Validate the transaction and get the actual amount to credit
    const validationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/transaction/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({ txHash }),
    });

    if (!validationResponse.ok) {
      const errorData: TransactionValidationError = await validationResponse.json();
      return NextResponse.json<CreditBalanceError>({
        error: 'Transaction validation failed',
        details: errorData.error,
        alreadyProcessed: errorData.alreadyProcessed,
      }, { status: validationResponse.status });
    }

    const validationData: TransactionValidationResponse = await validationResponse.json();

    // Use the validated USD value from the blockchain transaction
    // This ensures we credit the user for the actual DIMO amount they transferred
    const creditAmountInCents = Math.round(validationData.usdValue * 100);

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
        return NextResponse.json<CreditBalanceError>({
          error: 'No Stripe customer found',
        }, { status: 400 });
      }

      customerId = existingCustomers.data[0]!.id;
    }

    // Create a credit balance transaction (negative amount = credit to customer)
    const balanceTransaction = await stripe().customers.createBalanceTransaction(
      customerId,
      {
        amount: -Math.abs(creditAmountInCents), // Use validated amount from blockchain or request amount
        currency: currency.toLowerCase(),
        description: description || 'DIMO token conversion credit',
        metadata: {
          source: 'dimo_conversion',
          ...(txHash && { transactionHash: txHash }),
          ...metadata,
        },
      },
    );

    return NextResponse.json<CreditBalanceResponse>({
      success: true,
      transactionId: balanceTransaction.id,
      amount: Math.abs(creditAmountInCents),
      currency: balanceTransaction.currency,
    });
  } catch (error) {
    console.error('Error adding credit balance:', error);
    return NextResponse.json<CreditBalanceError>(
      { error: error instanceof Error ? error.message : 'Failed to add credit balance' },
      { status: 500 },
    );
  }
}
