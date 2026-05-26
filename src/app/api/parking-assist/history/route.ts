import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getParkingAssistBackendBaseUrl } from '@/libs/ParkingAssistBackend';
import { getSession } from '@/libs/Session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.dimoToken) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const query = new URLSearchParams();
    if (limit) {
      query.set('limit', limit);
    }
    if (offset) {
      query.set('offset', offset);
    }
    const qs = query.toString();
    const backendUrl = `${getParkingAssistBackendBaseUrl()}/account/parking-assist/history${qs ? `?${qs}` : ''}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${session.dimoToken}` },
      cache: 'no-store',
    });

    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching parking history:', error);
    return NextResponse.json({ error: 'Failed to fetch parking history' }, { status: 500 });
  }
}
