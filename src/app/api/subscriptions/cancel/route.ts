import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SubscriptionService } from '@/utils/SubscriptionService';

export async function DELETE(request: NextRequest) {
  try {
    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 },
      );
    }

    const result = await SubscriptionService.cancelSubscription(subscriptionId);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Error in cancel subscription endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 },
    );
  }
}
