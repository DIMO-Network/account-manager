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

    const { chain, walletAddress } = await request.json();

    if (!chain || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters: chain and walletAddress' },
        { status: 400 },
      );
    }

    // TODO: Call the DIMO accounts service to deploy the smart account
    // This should integrate with Ed's accounts repository
    // For now, return a placeholder response

    const accountsApiUrl = process.env.DIMO_GLOBAL_ACCOUNTS_API_URL;
    if (!accountsApiUrl) {
      return NextResponse.json(
        { error: 'Accounts API not configured' },
        { status: 500 },
      );
    }

    // Call the accounts service to deploy the smart account
    const response = await fetch(`${accountsApiUrl}/api/account/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.dimoToken}`,
      },
      body: JSON.stringify({
        chain,
        walletAddress,
        organizationId: session.userId, // Assuming userId is the organization ID
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Failed to deploy account' },
        { status: response.status },
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Account deployed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Account deployment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
