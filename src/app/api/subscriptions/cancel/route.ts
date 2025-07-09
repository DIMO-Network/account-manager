import type { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { featureFlags } from '@/utils/FeatureFlags';
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

    // V2: Use backend proxy if feature flag is enabled
    if (featureFlags.useBackendProxy) {
      console.warn(`🚩 Using backend proxy: ${featureFlags.backendApiUrl}`);

      const user = await currentUser();
      if (!user) {
        return NextResponse.json(
          { error: 'User not authenticated' },
          { status: 401 },
        );
      }

      const dimoToken = user.privateMetadata?.dimoToken as string;
      if (!dimoToken) {
        return NextResponse.json(
          { error: 'DIMO authentication required' },
          { status: 401 },
        );
      }

      const backendUrl = `${featureFlags.backendApiUrl}/subscription/cancel/${subscriptionId}`;

      const backendResponse = await fetch(backendUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${dimoToken}`,
        },
      });

      if (!backendResponse.ok) {
        const error = await backendResponse.json();
        return NextResponse.json(
          { error: error.message || 'Failed to cancel subscription' },
          { status: backendResponse.status },
        );
      }

      return NextResponse.json({ success: true });
    }

    // V1: Use local Stripe service
    console.warn('🚩 Using direct Stripe');
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
