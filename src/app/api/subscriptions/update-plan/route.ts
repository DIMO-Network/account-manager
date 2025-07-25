import type { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { featureFlags } from '@/utils/FeatureFlags';

export async function POST(request: NextRequest) {
  try {
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
        { error: 'DIMO authentication required - please sign in with DIMO' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { subscriptionId, newPriceId, prorationDate } = body;

    if (!subscriptionId || !newPriceId) {
      return NextResponse.json(
        { error: 'Subscription ID and new price ID are required' },
        { status: 400 },
      );
    }

    const backendUrl = `${featureFlags.backendApiUrl}/subscription/update-plan/${subscriptionId}`;

    const requestBody: any = {
      newPriceId,
    };

    if (prorationDate) {
      requestBody.prorationDate = prorationDate;
    }

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dimoToken}`,
        'Content-Type': 'application/json',
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
