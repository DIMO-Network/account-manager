import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSession } from '@/libs/Session';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ vehicleTokenId: string }> },
) {
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

    const { vehicleTokenId } = await params;
    if (!vehicleTokenId) {
      return NextResponse.json(
        { error: 'Vehicle token ID is required' },
        { status: 400 },
      );
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001'}/subscription/vehicle/${vehicleTokenId}/new-subscription`;

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
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 },
    );
  }
}
