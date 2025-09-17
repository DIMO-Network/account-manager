import { NextResponse } from 'next/server';
import { getOrCreateStripeCustomer } from '@/app/actions/getStripeCustomer';
import { getSession } from '@/libs/Session';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const result = await getOrCreateStripeCustomer();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 },
      );
    }

    return NextResponse.json({ customerId: result.customerId });
  } catch (error) {
    console.error('Error in customer API route:', error);
    return NextResponse.json(
      { error: 'Failed to get customer' },
      { status: 500 },
    );
  }
}
