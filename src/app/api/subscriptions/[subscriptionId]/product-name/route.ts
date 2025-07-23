import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/libs/Stripe';

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
