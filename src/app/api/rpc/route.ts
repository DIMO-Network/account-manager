import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, requestBody } = body;

    if (!url) {
      return NextResponse.json({ error: 'Missing RPC URL' }, { status: 400 });
    }

    if (!requestBody) {
      return NextResponse.json({ error: 'Missing request body' }, { status: 400 });
    }

    // Parse the request body to log what we're sending
    let parsedBody;
    try {
      parsedBody = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;
      console.warn('RPC Proxy Request:', {
        url,
        method: parsedBody.method,
        hasParams: !!parsedBody.params,
      });
    } catch (e) {
      console.warn('Could not parse request body for logging:', e);
    }

    // requestBody is already a JSON string from viem, send it directly
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = errorText;
      }
      console.error('RPC Proxy Error Response:', {
        url,
        status: response.status,
        statusText: response.statusText,
        errorDetails,
      });
      return NextResponse.json(
        { error: `RPC request failed: ${response.statusText}`, details: errorDetails },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('RPC proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
