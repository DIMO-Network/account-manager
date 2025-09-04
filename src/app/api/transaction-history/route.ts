import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSession } from '@/libs/Session';

export type TransactionHistoryEntry = {
  from: string;
  to: string;
  value: bigint;
  time: string;
  type?: 'Baseline' | 'Referrals' | 'Marketplace' | 'CreditTopUp';
  description: string;
};

async function authenticateUser() {
  const session = await getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }
  return session;
}

export async function GET(_request: NextRequest) {
  try {
    const session = await authenticateUser();
    const { dimoToken } = session;

    if (!dimoToken) {
      return NextResponse.json(
        { error: 'DIMO token not found' },
        { status: 401 },
      );
    }

    // Call the same backend endpoint as the mobile app
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://api.dimo.zone';
    const response = await fetch(`${backendUrl}/account/v2/transaction-history`, {
      headers: {
        'Authorization': `Bearer ${dimoToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch transaction history' },
      { status: 500 },
    );
  }
}
