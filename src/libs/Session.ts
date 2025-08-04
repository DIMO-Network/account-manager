import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import 'server-only';

export type SessionPayload = {
  userId: string;
  userEmail: string;
  walletAddress?: string;
  stripeCustomerId?: string;
  dimoToken: string;
  expiresAt: number;
};

// Get secret key for session signing
function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}

// Encrypt session data
export async function encryptSession(payload: Omit<SessionPayload, 'expiresAt'>) {
  const secretKey = getSessionSecret();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

  return new SignJWT({ ...payload, expiresAt })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

// Decrypt session data
export async function decryptSession(session: string | undefined = '') {
  try {
    const secretKey = getSessionSecret();
    const { payload } = await jwtVerify(session, secretKey, {
      algorithms: ['HS256'],
    });

    // Check if session has expired
    if (payload.expiresAt && typeof payload.expiresAt === 'number' && payload.expiresAt < Date.now()) {
      return null;
    }

    return payload as SessionPayload;
  } catch (error) {
    console.error('Failed to verify session:', error);
    return null;
  }
}

// Create session and set cookie
export async function createSession(userData: Omit<SessionPayload, 'expiresAt'>) {
  const session = await encryptSession(userData);
  const cookieStore = await cookies();

  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

// Get current session
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  if (!session) {
    return null;
  }

  return await decryptSession(session);
}

// Update session (refresh expiration)
export async function updateSession() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  // Create new session with updated expiration
  const { expiresAt, ...userData } = session;
  await createSession(userData);

  return session;
}

// Delete session (logout)
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

// Verify session and redirect if invalid
export async function verifySession() {
  const session = await getSession();

  if (!session) {
    redirect('/sign-in');
  }

  return session;
}
