import type { ParkingServicesCatalog } from '@/types/parking-assist';
import { NextResponse } from 'next/server';
import { fetchParkingAssistBackend } from '@/libs/ParkingAssistBackend';

export async function GET() {
  try {
    const result = await fetchParkingAssistBackend<ParkingServicesCatalog>(
      '/account/parking-assist/parking-services',
    );

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error fetching parking services catalog:', error);
    return NextResponse.json({ error: 'Failed to fetch parking services' }, { status: 500 });
  }
}
