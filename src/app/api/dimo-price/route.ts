import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const response = await fetch('https://api.dimo.co/dimo-token/price', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch DIMO token price');
    }

    const data = await response.json();

    return NextResponse.json({
      price: data.price,
      base: data.base,
      currency: data.currency,
    });
  } catch (error) {
    console.error('Error fetching DIMO token price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DIMO token price' },
      { status: 500 },
    );
  }
}
