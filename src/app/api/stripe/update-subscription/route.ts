import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/libs/Stripe';

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId, newPriceId, prorationDate } = await req.json();

    // Get the current subscription to find the subscription item ID
    const subscription = await stripe().subscriptions.retrieve(subscriptionId, {
      expand: ['items.data'],
    });

    const subscriptionItemId = subscription.items.data[0]?.id;
    if (!subscriptionItemId) {
      return NextResponse.json({ success: false, error: 'No subscription item found' }, { status: 400 });
    }

    const updateParams: any = {
      items: [
        {
          id: subscriptionItemId,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
      cancel_at_period_end: false,
    };

    if (prorationDate) {
      updateParams.proration_date = prorationDate;
    }

    await stripe().subscriptions.update(subscriptionId, updateParams);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error occurred',
    }, { status: 500 });
  }
}
