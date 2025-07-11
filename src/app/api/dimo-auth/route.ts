import type { NextRequest } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { logger } from '@/libs/Logger';
import { getBaseUrl } from '@/utils/Helpers';
import { verifyDimoJwt } from '@/utils/verifyDimoJwt';

async function fetchDimoProfile(dimoToken: string) {
  const profilesResponse = await fetch('https://profiles.dimo.co/v1/account', {
    headers: {
      Authorization: `Bearer ${dimoToken}`,
      Accept: 'application/json',
    },
  });

  if (!profilesResponse.ok) {
    throw new Error(`Failed to fetch DIMO profile: ${profilesResponse.status}`);
  }

  return await profilesResponse.json();
}

async function ensureClerkUser(dimoProfile: any, dimoToken: string) {
  const client = await clerkClient();
  const userEmail = dimoProfile.email?.address;
  const walletAddress = dimoProfile.wallet?.address;

  if (!userEmail) {
    throw new Error('No email found in DIMO profile');
  }

  // Check if user exists in Clerk
  const existingUsers = await client.users.getUserList({
    emailAddress: [userEmail],
  });

  let user = existingUsers.data[0];

  if (user) {
    // Update existing user with DIMO data
    user = await client.users.updateUserMetadata(user.id, {
      publicMetadata: {
        ...user.publicMetadata,
        hasDimoAccount: true,
        walletAddress: walletAddress || null,
        lastDimoSync: new Date().toISOString(),
      },
      privateMetadata: {
        ...user.privateMetadata,
        dimoToken,
      },
    });

    logger.info('Updated existing Clerk user with DIMO data', { userId: user.id, email: userEmail });
  } else {
    // Create new Clerk user
    user = await client.users.createUser({
      emailAddress: [userEmail],
      publicMetadata: {
        hasDimoAccount: true,
        walletAddress: walletAddress || null,
        signupMethod: 'dimo',
        registrationDate: new Date().toISOString(),
      },
      privateMetadata: {
        dimoToken,
      },
      skipPasswordRequirement: true,
    });

    logger.info('Created new Clerk user with DIMO data', { userId: user.id, email: userEmail });
  }

  return user;
}

export async function GET(request: NextRequest) {
  // Validate required environment variables
  if (!process.env.DIMO_JWKS_URL) {
    logger.error('DIMO_JWKS_URL environment variable is not set');
    return NextResponse.redirect(new URL('/sign-in?error=configuration_error', getBaseUrl()));
  }

  if (!process.env.DIMO_JWT_ISSUER) {
    logger.error('DIMO_JWT_ISSUER environment variable is not set');
    return NextResponse.redirect(new URL('/sign-in?error=configuration_error', getBaseUrl()));
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const error = searchParams.get('error');

  if (error) {
    logger.error('DIMO OAuth error:', error);
    return NextResponse.redirect(new URL('/sign-in?error=dimo_failed', getBaseUrl()));
  }

  if (!token) {
    logger.error('Missing DIMO token');
    return NextResponse.redirect(new URL('/sign-in?error=missing_token', getBaseUrl()));
  }

  try {
    // 1. Validate DIMO JWT
    const payload = await verifyDimoJwt(token);
    logger.info('DIMO JWT validated successfully', { sub: payload.sub });

    // 2. Get user details from DIMO Profiles API
    const dimoProfile = await fetchDimoProfile(token);
    logger.info('DIMO profile fetched successfully', { email: dimoProfile.email?.address });

    // 3. Ensure Clerk user exists and is updated
    const clerkUser = await ensureClerkUser(dimoProfile, token);

    // 4. Create sign-in token for automatic sign-in
    const client = await clerkClient();
    const signInToken = await client.signInTokens.createSignInToken({
      userId: clerkUser.id,
      expiresInSeconds: 300, // 5 minutes
    });

    // 5. Set DIMO JWT as secure cookie for API fallback
    const response = NextResponse.redirect(new URL('/sign-in', getBaseUrl()));
    response.cookies.set('dimo_jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
    });

    // 6. Add sign-in token to redirect URL
    const signInUrl = new URL('/sign-in', getBaseUrl());
    signInUrl.searchParams.set('token', signInToken.token);
    signInUrl.searchParams.set('action', 'auto-signin');
    signInUrl.searchParams.set('email', dimoProfile.email?.address || '');

    logger.info('Redirecting to sign-in with auto-signin token', { userId: clerkUser.id });
    return NextResponse.redirect(signInUrl);
  } catch (error) {
    logger.error('DIMO auth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(
      new URL(`/sign-in?error=auth_failed&details=${encodeURIComponent(errorMessage)}`, getBaseUrl()),
    );
  }
}
