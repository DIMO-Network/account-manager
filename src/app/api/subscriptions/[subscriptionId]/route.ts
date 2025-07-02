import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/libs/Stripe';

export async function GET(
  _req: NextRequest,
  { params }: { params: { subscriptionId: string } },
) {
  const { subscriptionId } = params;

  if (!subscriptionId) {
    return NextResponse.json({ error: 'No subscriptionId provided' }, { status: 400 });
  }

  try {
    const subscription = await stripe().subscriptions.retrieve(subscriptionId);
    return NextResponse.json(subscription);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}
