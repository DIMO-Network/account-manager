import type { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/libs/Stripe';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> },
) {
  try {
    const { scheduleId } = await params;
    const body = await request.json();
    const { preserve_cancel_date = false } = body;

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'No scheduleId provided' },
        { status: 400 },
      );
    }

    // Check if user is authenticated
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 },
      );
    }

    // Release the subscription schedule
    const releasedSchedule = await stripe().subscriptionSchedules.release(scheduleId, {
      preserve_cancel_date,
    });

    return NextResponse.json({
      success: true,
      schedule: releasedSchedule,
    });
  } catch (error: any) {
    console.error('Error releasing subscription schedule:', error);

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    if (error.type === 'StripePermissionError') {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { error: 'Failed to release subscription schedule' },
      { status: 500 },
    );
  }
}
