import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/libs/Stripe';

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId, newPriceId, prorationDate } = await req.json();

    // Get the current subscription to find the subscription item ID
    const subscription = await stripe().subscriptions.retrieve(subscriptionId, {
      expand: ['items.data', 'items.data.price', 'schedule'],
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
      const existingSchedule = subscription.schedule as any;

      // Check if subscription is already attached to a schedule
      if (existingSchedule && existingSchedule.id) {
        console.warn(`Subscription ${subscriptionId} is already attached to schedule ${existingSchedule.id}.`);

        // Check if the schedule is in a state where we can update it
        if (existingSchedule.status === 'not_started' || existingSchedule.status === 'active') {
          // Try to update the existing schedule by adding a new phase
          try {
            const currentPhases = existingSchedule.phases || [];
            const currentPeriodEnd = subscription.items.data[0]?.current_period_end;

            // Create new phases array with the additional monthly phase
            const updatedPhases = [
              ...currentPhases,
              {
                items: [
                  { price: newPriceId, quantity: 1 },
                ],
                start_date: currentPeriodEnd,
                proration_behavior: 'none',
              },
            ];

            await stripe().subscriptionSchedules.update(existingSchedule.id, {
              phases: updatedPhases,
            });

            return NextResponse.json({ success: true, scheduled: true });
          } catch (scheduleUpdateError) {
            console.warn('Failed to update existing schedule, trying to release and recreate:', scheduleUpdateError);

            // If updating the schedule fails, try to release it and create a new one
            try {
              // Release the existing schedule
              await stripe().subscriptionSchedules.release(existingSchedule.id, {
                preserve_cancel_date: false,
              });

              // Wait a moment for the release to process
              await new Promise(resolve => setTimeout(resolve, 1000));

              // Create a new schedule from the subscription
              const newSchedule = await stripe().subscriptionSchedules.create({
                from_subscription: subscriptionId,
              });

              const phase0 = newSchedule.phases[0];
              if (!phase0) {
                return NextResponse.json({ success: false, error: 'No phase found in new subscription schedule' }, { status: 500 });
              }

              await stripe().subscriptionSchedules.update(newSchedule.id, {
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
            } catch (releaseError) {
              console.error('Failed to release and recreate schedule:', releaseError);
              return NextResponse.json({
                success: false,
                error: 'Unable to update subscription schedule. Please try again later or contact support.',
              }, { status: 500 });
            }
          }
        } else {
          // Schedule is in a state where we can't update it
          return NextResponse.json({
            success: false,
            error: 'Subscription schedule is not in a state where it can be updated. Please try again later.',
          }, { status: 400 });
        }
      }

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

    // For other interval changes (monthly to annual, etc.), check if subscription is managed by a schedule
    const existingSchedule = subscription.schedule as any;
    if (existingSchedule && existingSchedule.id) {
      return NextResponse.json({
        success: false,
        error: 'This subscription is managed by a schedule and cannot be updated directly. Please contact support.',
      }, { status: 400 });
    }

    // Immediate update with proration (only for subscriptions not managed by schedules)
    const currentPriceId = subscription.items.data[0]?.price?.id;
    const isSamePlan = newPriceId === currentPriceId;

    const updateParams: any = {
      items: [
        {
          id: subscriptionItemId,
          price: newPriceId,
        },
      ],
      cancel_at_period_end: false,
    };

    // If it's the same plan, don't create prorations (reactivation without charge)
    if (!isSamePlan) {
      updateParams.proration_behavior = 'create_prorations';
      if (prorationDate) {
        updateParams.proration_date = prorationDate;
      }
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
