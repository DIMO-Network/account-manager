import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getParkingAssistBackendBaseUrl } from '@/libs/ParkingAssistBackend';
import { getSession } from '@/libs/Session';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.dimoToken) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { sessionId } = await params;
    const backendUrl = `${getParkingAssistBackendBaseUrl()}/account/parking-assist/sessions/${sessionId}`;

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
    console.error('Error fetching parking session:', error);
    return NextResponse.json({ error: 'Failed to fetch parking session' }, { status: 500 });
  }
}
