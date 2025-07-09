import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/libs/Stripe';

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId, newPriceId, prorationDate } = await req.json();

    // Get the current subscription to find the subscription item ID
    const subscription = await stripe().subscriptions.retrieve(subscriptionId, {
      expand: ['items.data', 'items.data.price'],
    });

    const subscriptionItemId = subscription.items.data[0]?.id;
    if (!subscriptionItemId) {
      return NextResponse.json({ success: false, error: 'No subscription item found' }, { status: 400 });
    }

    // Determine current and new interval
    const currentInterval = subscription.items.data[0]?.price?.recurring?.interval;
    const newPrice = await stripe().prices.retrieve(newPriceId);
    const newInterval = newPrice?.recurring?.interval;

    // If switching from annual to monthly, schedule at period end using a subscription schedule
    if (currentInterval === 'year' && newInterval === 'month') {
      const currentPriceId = subscription.items.data[0]?.price?.id;
      // Step 1: Create the schedule from the subscription
      const schedule = await stripe().subscriptionSchedules.create({
        from_subscription: subscriptionId,
      });
      // Step 2: Update the schedule to add the new phase
      const phase0 = schedule.phases[0];
      if (!phase0) {
        return NextResponse.json({ success: false, error: 'No phase found in subscription schedule' }, { status: 500 });
      }
      await stripe().subscriptionSchedules.update(schedule.id, {
        phases: [
          {
            items: [
              { price: currentPriceId, quantity: 1 },
            ],
            start_date: phase0.start_date,
            end_date: phase0.end_date,
            proration_behavior: 'none',
          },
          {
            items: [
              { price: newPriceId, quantity: 1 },
            ],
            start_date: phase0.end_date,
            proration_behavior: 'none',
          },
        ],
      });
      return NextResponse.json({ success: true, scheduled: true });
    }

    // Immediate update with proration
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
    return NextResponse.json({ success: true, scheduled: false });
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error occurred',
    }, { status: 500 });
  }
}
