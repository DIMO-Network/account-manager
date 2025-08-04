import type { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authorizeSubscriptionAccess } from '@/libs/StripeSubscriptionService';
import { featureFlags } from '@/utils/FeatureFlags';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, newPriceId, prorationDate, billingCycleAnchor } = body;

    if (!subscriptionId || !newPriceId) {
      return NextResponse.json(
        { error: 'Subscription ID and new price ID are required' },
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

    // Check if JWT token is missing
    if (!jwtToken) {
      return NextResponse.json(
        { error: 'DIMO session expired. Please sign in with DIMO again.' },
        { status: 401 },
      );
    }

    const authResult = await authorizeSubscriptionAccess(subscriptionId, dimoToken, jwtToken);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
    }

    const backendUrl = `${featureFlags.backendApiUrl}/subscription/update-plan/${subscriptionId}`;

    const requestBody: any = {
      newPriceId,
    };

    if (prorationDate) {
      requestBody.prorationDate = prorationDate;
    }

    if (billingCycleAnchor) {
      requestBody.billingCycleAnchor = billingCycleAnchor;
    }

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(jwtToken && { Authorization: `Bearer ${jwtToken}` }),
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      console.error('Backend API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        url: backendUrl,
      });

      // If it's a 401, the token might be expired
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'DIMO token expired - please sign in with DIMO again' },
          { status: 401 },
        );
      }

      return NextResponse.json(
        { error: errorData.message || `Backend API error: ${response.status}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription plan' },
      { status: 500 },
    );
  }
}
