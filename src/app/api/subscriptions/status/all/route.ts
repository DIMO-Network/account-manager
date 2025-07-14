import type { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { featureFlags } from '@/utils/FeatureFlags';

export async function GET(_request: NextRequest) {
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

    const backendUrl = `${featureFlags.backendApiUrl}/subscription/status/all`;

    console.warn('Making backend request to:', backendUrl);
    console.warn('Using DIMO token (first 20 chars):', `${dimoToken.substring(0, 20)}...`);

    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${dimoToken}`,
        'Content-Type': 'application/json',
      },
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
    console.warn('Backend response data:', data);
    console.warn('Number of subscriptions in response:', Array.isArray(data) ? data.length : 'Not an array');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching all subscription statuses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription statuses' },
      { status: 500 },
    );
  }
}
