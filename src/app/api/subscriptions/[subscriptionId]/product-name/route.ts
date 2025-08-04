import type { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/libs/Stripe';
import { authorizeSubscriptionAccess } from '@/libs/StripeSubscriptionService';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> },
) {
  try {
    const { subscriptionId } = await params;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 },
      );
    }

    // Get current user and check authorization
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const dimoToken = user.privateMetadata?.dimoToken as string;
    const jwtToken = (await cookies()).get('dimo_jwt')?.value;
    const authResult = await authorizeSubscriptionAccess(subscriptionId, dimoToken, jwtToken);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
    }

    // Fetch the subscription with expanded product information
    const subscription = await stripe().subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    });

    // Get the product name from the first item
    const product = subscription?.items?.data?.[0]?.price?.product;
    const productName = typeof product === 'object' && product && 'name' in product
      ? product.name
      : `Subscription ${subscriptionId}`;

    return NextResponse.json({ productName });
  } catch (error) {
    console.error('Error fetching product name:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product name' },
      { status: 500 },
    );
  }
}
