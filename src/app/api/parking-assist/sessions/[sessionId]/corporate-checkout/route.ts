import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getParkingAssistBackendBaseUrl } from '@/libs/ParkingAssistBackend';
import { getSession } from '@/libs/Session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.dimoToken) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const idempotencyKey = request.headers.get('idempotency-key')?.trim();
    if (!idempotencyKey) {
      return NextResponse.json({ error: 'Idempotency-Key header is required' }, { status: 400 });
    }

    const { sessionId } = await params;

    let zoneCode: string | undefined;
    try {
      const body = (await request.json()) as { zoneCode?: string };
      zoneCode = body.zoneCode?.trim();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!zoneCode) {
      return NextResponse.json({ error: 'zone_code_required' }, { status: 400 });
    }

    const backendUrl
      = `${getParkingAssistBackendBaseUrl()}/account/parking-assist/sessions/${sessionId}/corporate-checkout`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.dimoToken}`,
        'Idempotency-Key': idempotencyKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ zoneCode }),
    });

    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error starting corporate parking checkout:', error);
    return NextResponse.json({ error: 'Failed to start parking checkout' }, { status: 500 });
  }
}
