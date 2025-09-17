import type { NextRequest } from 'next/server';
import type { DIMOProfile } from '@/types/dimo';
import { NextResponse } from 'next/server';
import { logger } from '@/libs/Logger';
import { createSession } from '@/libs/Session';
import { getBaseUrl } from '@/utils/Helpers';
import { verifyDimoJwt } from '@/utils/verifyDimoJwt';

async function fetchDimoProfile(dimoToken: string): Promise<DIMOProfile> {
  const profilesApiUrl = process.env.DIMO_PROFILES_API_URL || 'https://profiles.dimo.co/v1/account';

  const profilesResponse = await fetch(profilesApiUrl, {
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

async function createUserSession(dimoProfile: DIMOProfile, dimoToken: string) {
  const userEmail = dimoProfile.email?.address;
  const profileWalletAddress = dimoProfile.wallet?.address;
  const dimoUserId = dimoProfile.id;

  if (!userEmail) {
    throw new Error('No email found in DIMO profile');
  }

  if (!dimoUserId) {
    throw new Error('No user ID found in DIMO profile');
  }

  // Get wallet address from JWT as fallback if not in profile
  let walletAddress = profileWalletAddress;
  if (!walletAddress) {
    try {
      const payload = await verifyDimoJwt(dimoToken);
      walletAddress = payload.ethereum_address;
      logger.info({
        walletAddress,
        profileWalletAddress: profileWalletAddress || 'none',
      }, 'Using wallet address from JWT as fallback');
    } catch (error) {
      logger.warn({ error }, 'Could not extract wallet address from JWT');
    }
  }

  // Create session with user data using DIMO's unique ID
  await createSession({
    userId: dimoUserId,
    userEmail,
    walletAddress: walletAddress || undefined,
    stripeCustomerId: undefined, // Will be set when needed
    dimoToken,
  });

  logger.info({
    userId: dimoUserId,
    email: userEmail,
    walletAddress: walletAddress || 'none',
  }, 'Created user session with DIMO data');

  return { userId: dimoUserId, userEmail, walletAddress };
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
    logger.error({ error }, 'DIMO OAuth error');
    return NextResponse.redirect(new URL('/sign-in?error=dimo_failed', getBaseUrl()));
  }

  if (!token) {
    logger.error('Missing DIMO token');
    return NextResponse.redirect(new URL('/sign-in?error=missing_token', getBaseUrl()));
  }

  try {
    // 1. Validate DIMO JWT
    const payload = await verifyDimoJwt(token);
    logger.info({ sub: payload.sub }, 'DIMO JWT validated successfully');

    // 2. Get user details from DIMO Profiles API
    const dimoProfile = await fetchDimoProfile(token);
    logger.info({ email: dimoProfile.email?.address }, 'DIMO profile fetched successfully');

    // 3. Create user session with DIMO data
    const userData = await createUserSession(dimoProfile, token);

    // 4. Set DIMO JWT as secure cookie for API fallback
    const response = NextResponse.redirect(new URL('/dashboard', getBaseUrl()));
    response.cookies.set('dimo_jwt', token, {
      httpOnly: process.env.NODE_ENV === 'production',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Number.parseInt(process.env.DIMO_JWT_COOKIE_MAX_AGE || '7200'), // 2 hours default
      path: '/',
    });

    logger.info({ userId: userData.userId }, 'Redirecting to dashboard with authenticated session');
    return response;
  } catch (error) {
    logger.error({ error }, 'DIMO auth error');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(
      new URL(`/sign-in?error=auth_failed&details=${encodeURIComponent(errorMessage)}`, getBaseUrl()),
    );
  }
}
