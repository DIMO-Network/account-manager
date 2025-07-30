import type { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { featureFlags } from '@/utils/FeatureFlags';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ vehicleTokenId: string }> },
) {
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

    const { vehicleTokenId } = await params;
    if (!vehicleTokenId) {
      return NextResponse.json(
        { error: 'Vehicle token ID is required' },
        { status: 400 },
      );
    }

    const backendUrl = `${featureFlags.backendApiUrl}/subscription/vehicle/${vehicleTokenId}/new-subscription-link`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dimoToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan: 'monthly',
      }),
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
    console.error('Error creating subscription link:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription link' },
      { status: 500 },
    );
  }
}
