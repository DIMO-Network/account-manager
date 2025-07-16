import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSession } from '@/libs/Session';

async function authenticateUser() {
  const session = await getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }
  return session;
}

export async function GET(_request: NextRequest) {
  try {
    const user = await authenticateUser();
    const dimoToken = user.dimoToken as string;
    const walletAddress = user.walletAddress as string;

    if (!dimoToken) {
      return NextResponse.json(
        { error: 'DIMO authentication required' },
        { status: 401 },
      );
    }

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'No wallet address found' },
        { status: 400 },
      );
    }

    const TOKEN_CONTRACT = process.env.NEXT_PUBLIC_USE_OMID_TOKEN
      ? (process.env.OMID_TOKEN_CONTRACT || '0x21cfe003997fb7c2b3cfe5cf71e7833b7b2ece10') // OMID (Polygon Amoy)
      : (process.env.DIMO_TOKEN_CONTRACT || '0xE261D618a959aFfFd53168Cd07D12E37B26761db'); // DIMO (Polygon Mainnet)

    const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_USE_OMID_TOKEN ? 'OMID' : 'DIMO';

    const rpcUrl = process.env.NEXT_PUBLIC_USE_OMID_TOKEN
      ? (process.env.POLYGON_AMOY_RPC_URL || 'https://polygon-amoy.drpc.org')
      : (process.env.POLYGON_MAINNET_RPC_URL || 'https://polygon-rpc.com');

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: TOKEN_CONTRACT,
            data: `0x70a08231000000000000000000000000${walletAddress.replace('0x', '')}`,
          },
          'latest',
        ],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${TOKEN_SYMBOL} balance: ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(`RPC error: ${result.error.message}`);
    }

    // Convert hex balance to decimal
    const balanceHex = result.result;

    // Handle empty balance (0x) or zero balance (0x0)
    if (!balanceHex || balanceHex === '0x' || balanceHex === '0x0') {
      return NextResponse.json({
        balance: 0,
        currency: TOKEN_SYMBOL,
        walletAddress,
      });
    }

    const balanceWei = BigInt(balanceHex);
    const balanceTokens = Number(balanceWei) / 10 ** 18;

    return NextResponse.json({
      balance: balanceTokens,
      currency: TOKEN_SYMBOL,
      walletAddress,
    });
  } catch (error) {
    console.error('Error fetching token balance:', error);
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch token balance' },
      { status: 500 },
    );
  }
}
