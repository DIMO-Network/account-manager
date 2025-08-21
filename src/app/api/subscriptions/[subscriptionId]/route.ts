import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authorizeSubscriptionAccess } from '@/libs/BackendSubscriptionService';
import { getSession } from '@/libs/Session';
import { stripe } from '@/libs/Stripe';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> },
) {
  const { subscriptionId } = await params;

  if (!subscriptionId) {
    return NextResponse.json({ error: 'No subscriptionId provided' }, { status: 400 });
  }

  // Get current session and check authorization
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  const dimoToken = session.dimoToken;
  const jwtToken = (await cookies()).get('dimo_jwt')?.value;
  const authResult = await authorizeSubscriptionAccess(subscriptionId, dimoToken, jwtToken);
  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const subscription = await stripe().subscriptions.retrieve(subscriptionId);
    return NextResponse.json(subscription);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> },
) {
  try {
    const { subscriptionId } = await params;
    const body = await request.json();
    const { cancellationDetails } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'No subscriptionId provided' },
        { status: 400 },
      );
    }

    // Get current session and check authorization
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const dimoToken = session.dimoToken;
    const jwtToken = (await cookies()).get('dimo_jwt')?.value;
    const authResult = await authorizeSubscriptionAccess(subscriptionId, dimoToken, jwtToken);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001'}/subscription/update/${subscriptionId}`;

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancel_at_period_end: true,
        cancellation_details: cancellationDetails
          ? {
              feedback: cancellationDetails.feedback,
              comment: cancellationDetails.comment,
            }
          : undefined,
      }),
    });

    if (!backendResponse.ok) {
      const error = await backendResponse.json();
      return NextResponse.json(
        { error: error.message || 'Failed to update subscription' },
        { status: backendResponse.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in update subscription endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 },
    );
  }
}
