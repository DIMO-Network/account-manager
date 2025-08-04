import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSession } from '@/libs/Session';
import { featureFlags } from '@/utils/FeatureFlags';

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 },
      );
    }

    const dimoToken = session.dimoToken as string;
    if (!dimoToken) {
      return NextResponse.json(
        { error: 'DIMO authentication required - please sign in with DIMO' },
        { status: 401 },
      );
    }

    const backendUrl = `${featureFlags.backendApiUrl}/subscription/status/all`;

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
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching all subscription statuses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription statuses' },
      { status: 500 },
    );
  }
}
