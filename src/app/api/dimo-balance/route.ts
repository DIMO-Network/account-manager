import type { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

async function authenticateUser() {
  const user = await currentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
}

export async function GET(_request: NextRequest) {
  try {
    const user = await authenticateUser();
    const dimoToken = user.privateMetadata?.dimoToken as string;
    const walletAddress = user.publicMetadata?.walletAddress as string;

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

    // Fetch DIMO balance using blockchain contract call
    // Using the same approach as dimo-driver app
    const DIMO_TOKEN_CONTRACT = '0xE261D618a959aFfFd53168Cd07D12E37B26761db'; // Polygon mainnet

    // Use Alchemy or similar RPC to call the contract
    const rpcUrl = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';

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
            to: DIMO_TOKEN_CONTRACT,
            data: `0x70a08231000000000000000000000000${walletAddress.replace('0x', '')}`,
          },
          'latest',
        ],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch DIMO balance: ${response.status}`);
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
        currency: 'DIMO',
        walletAddress,
      });
    }

    const balanceWei = BigInt(balanceHex);
    const balanceDimo = Number(balanceWei) / 10 ** 18; // DIMO has 18 decimals

    return NextResponse.json({
      balance: balanceDimo,
      currency: 'DIMO',
      walletAddress,
    });
  } catch (error) {
    console.error('Error fetching DIMO balance:', error);
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch DIMO balance' },
      { status: 500 },
    );
  }
}
