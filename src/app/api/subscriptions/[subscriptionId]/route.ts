import type { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/libs/Stripe';
import { featureFlags } from '@/utils/FeatureFlags';
import { authorizeSubscriptionAccess } from '@/utils/subscriptionHelpers';
import { SubscriptionService } from '@/utils/SubscriptionService';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> },
) {
  const { subscriptionId } = await params;

  if (!subscriptionId) {
    return NextResponse.json({ error: 'No subscriptionId provided' }, { status: 400 });
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

  try {
    const subscription = await stripe().subscriptions.retrieve(subscriptionId);
    return NextResponse.json(subscription);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> },
) {
  try {
    const { subscriptionId } = await params;
    const body = await request.json();
    const { cancellationDetails } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'No subscriptionId provided' },
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

    // V2: Use backend proxy if feature flag is enabled
    if (featureFlags.useBackendProxy) {
      console.warn(`🚩 Using backend proxy: ${featureFlags.backendApiUrl}`);

      const backendUrl = `${featureFlags.backendApiUrl}/subscription/update/${subscriptionId}`;

      const backendResponse = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancel_at_period_end: true,
          cancellation_details: cancellationDetails
            ? {
                feedback: cancellationDetails.feedback,
                comment: cancellationDetails.comment,
              }
            : undefined,
        }),
      });

      if (!backendResponse.ok) {
        const error = await backendResponse.json();
        return NextResponse.json(
          { error: error.message || 'Failed to update subscription' },
          { status: backendResponse.status },
        );
      }

      return NextResponse.json({ success: true });
    }

    // V1: Use local Stripe service
    console.warn('🚩 Using direct Stripe');
    const result = await SubscriptionService.updateSubscription(subscriptionId, cancellationDetails);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Error in update subscription endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 },
    );
  }
}
