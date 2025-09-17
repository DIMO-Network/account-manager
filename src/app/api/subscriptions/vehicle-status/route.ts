import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSession } from '@/libs/Session';

export async function POST(request: NextRequest) {
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

    const { vehicleTokenIds } = await request.json();

    if (!Array.isArray(vehicleTokenIds)) {
      return NextResponse.json(
        { error: 'vehicleTokenIds must be an array' },
        { status: 400 },
      );
    }

    const statusMap: Record<number, boolean> = {};

    // Check each vehicle status in parallel
    const statusPromises = vehicleTokenIds.map(async (tokenId: number) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/subscription/vehicle/${tokenId}/status`, {
          headers: {
            'Authorization': `Bearer ${dimoToken}`,
            'Content-Type': 'application/json',
          },
        });

        return { tokenId, exists: response.ok };
      } catch (error) {
        console.error(`Error checking vehicle ${tokenId}:`, error);
        return { tokenId, exists: false };
      }
    });

    const results = await Promise.all(statusPromises);

    results.forEach(({ tokenId, exists }) => {
      statusMap[tokenId] = exists;
    });

    return NextResponse.json({ vehicleStatuses: statusMap });
  } catch (error) {
    console.error('Error checking vehicle statuses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
