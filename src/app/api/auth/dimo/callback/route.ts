import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getBaseUrl } from '@/utils/Helpers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const walletAddress = searchParams.get('walletAddress');
  const error = searchParams.get('error');

  if (error) {
    console.error('DIMO OAuth error:', error);
    return NextResponse.redirect(new URL('/sign-in?error=dimo_failed', getBaseUrl()));
  }

  if (!token || !email) {
    console.error('Missing required parameters:', { hasToken: !!token, email });
    return NextResponse.redirect(new URL('/sign-in?error=missing_token_or_email', getBaseUrl()));
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
    const registerResponse = await fetch(`${getBaseUrl()}/api/auth/dimo/register`, {
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
      const redirectUrl = new URL('/sign-in', getBaseUrl());
      redirectUrl.searchParams.set('token', result.signInToken);
      redirectUrl.searchParams.set('action', 'auto-signin');

      const response = NextResponse.redirect(redirectUrl);

      // Set DIMO JWT as secure cookie for API fallback
      response.cookies.set('dimo_jwt', token, {
        httpOnly: process.env.NODE_ENV === 'production',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: Number.parseInt(process.env.DIMO_JWT_COOKIE_MAX_AGE || '7200'), // 2 hours default
        path: '/', // Ensure it's available for all paths
      });

      return response;
    } else {
      // Fallback to manual sign-in
      const redirectUrl = new URL('/sign-in', getBaseUrl());
      redirectUrl.searchParams.set('email', userEmail);
      redirectUrl.searchParams.set('message', result.isExistingUser ? 'dimo_updated' : 'dimo_registered');

      const response = NextResponse.redirect(redirectUrl);

      // Set DIMO JWT as secure cookie for API fallback
      response.cookies.set('dimo_jwt', token, {
        httpOnly: process.env.NODE_ENV === 'production',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: Number.parseInt(process.env.DIMO_JWT_COOKIE_MAX_AGE || '7200'), // 2 hours default
        path: '/', // Ensure it's available for all paths
      });

      return response;
    }
  } catch (error) {
    console.error('DIMO callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(new URL(`/sign-in?error=auth_failed&details=${encodeURIComponent(errorMessage)}`, getBaseUrl()));
  }
}
