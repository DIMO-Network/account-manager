import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SubscriptionService } from '@/utils/SubscriptionService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serialNumber = searchParams.get('serial');

  if (!serialNumber) {
    return NextResponse.json(
      { error: 'Serial number is required' },
      { status: 400 },
    );
  }

  try {
    const result = await SubscriptionService.checkDeviceSubscription(serialNumber);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 },
    );
  }
}
