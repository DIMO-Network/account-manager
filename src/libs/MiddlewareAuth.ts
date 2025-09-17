import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decryptSession } from './Session';

// Verify session from cookies (for middleware)
export async function verifySessionFromCookies(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const session = await decryptSession(sessionCookie);
    return session;
  } catch (error) {
    console.error('Failed to verify session in middleware:', error);
    return null;
  }
}

// Check if user is authenticated (for middleware)
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const session = await verifySessionFromCookies(request);
  return !!session;
}

// Redirect to sign-in if not authenticated
export function redirectToSignIn(request: NextRequest, locale: string = 'en') {
  const signInUrl = new URL(`/${locale}/sign-in`, request.url);
  return NextResponse.redirect(signInUrl);
}
