import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const walletAddress = searchParams.get('walletAddress');
  const error = searchParams.get('error');

  if (error) {
    console.error('DIMO OAuth error:', error);
    return NextResponse.redirect(new URL('/sign-in?error=dimo_failed', request.url));
  }

  if (!token || !email) {
    console.error('Missing required parameters:', { hasToken: !!token, email });
    return NextResponse.redirect(new URL('/sign-in?error=missing_token_or_email', request.url));
  }

  try {
    // Verify the token is valid by decoding it (basic validation)
    let payload;
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid JWT format - expected 3 parts');
      }

      const payloadPart = tokenParts[1];
      if (!payloadPart) {
        throw new Error('Invalid JWT format - missing payload');
      }

      payload = JSON.parse(atob(payloadPart));
    } catch {
      throw new Error('Invalid token format');
    }

    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new Error('Token has expired');
    }

    // Use email from token payload if available, otherwise use query param
    const userEmail = payload.email || email;
    const userWalletAddress = payload.ethereum_address || walletAddress;

    if (!userEmail) {
      throw new Error('No email found in token or query parameters');
    }

    // Register/update user with backend
    const registerResponse = await fetch(`${request.nextUrl.origin}/api/auth/dimo/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userEmail,
        walletAddress: userWalletAddress,
        dimoToken: token,
      }),
    });

    const result = await registerResponse.json();

    if (!registerResponse.ok) {
      console.error('Registration failed:', result);
      throw new Error(result.error || 'Registration failed');
    }

    // Create a secure redirect URL with the sign-in token
    if (result.signInToken) {
      const redirectUrl = new URL('/sign-in', request.url);
      redirectUrl.searchParams.set('token', result.signInToken);
      redirectUrl.searchParams.set('action', 'auto-signin');
      return NextResponse.redirect(redirectUrl);
    } else {
      // Fallback to manual sign-in
      const redirectUrl = new URL('/sign-in', request.url);
      redirectUrl.searchParams.set('email', userEmail);
      redirectUrl.searchParams.set('message', result.isExistingUser ? 'dimo_updated' : 'dimo_registered');
      return NextResponse.redirect(redirectUrl);
    }
  } catch (error) {
    console.error('DIMO callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(new URL(`/sign-in?error=auth_failed&details=${encodeURIComponent(errorMessage)}`, request.url));
  }
}
