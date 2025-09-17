import { verifyUserSession } from '@/libs/DAL';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await verifyUserSession();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({
      id: user.userId,
      email: user.userEmail,
      walletAddress: user.walletAddress,
      stripeCustomerId: user.stripeCustomerId,
      dimoToken: user.dimoToken,
    });
  } catch (error) {
    console.error('Auth check failed:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
