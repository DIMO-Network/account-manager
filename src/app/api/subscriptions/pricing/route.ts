import { getSession } from '@/libs/Session';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/subscription/plan-details`, {
      headers: {
        Authorization: `Bearer ${dimoToken}`,
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pricing: ${response.status} ${response.statusText}`);
    }

    const pricingData = await response.json();
    return NextResponse.json(pricingData);
  } catch (error) {
    console.error('Error fetching pricing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to load pricing information';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}
