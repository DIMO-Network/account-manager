import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSession } from '@/libs/Session';

export async function POST(
  request: NextRequest,
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

    // Read the plan from the request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 },
      );
    }

    const { plan } = requestBody;
    if (!plan || (plan !== 'monthly' && plan !== 'annual')) {
      return NextResponse.json(
        { error: 'Valid plan (monthly or annual) is required' },
        { status: 400 },
      );
    }

    const cancelUrl = requestBody.cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001'}/subscription/vehicle/${vehicleTokenId}/new-subscription-link`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dimoToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan, // Use the plan from the request body
        trial_period_days: 0, // No trial period for reactivation
        success_url: successUrl,
        cancel_url: cancelUrl,
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
