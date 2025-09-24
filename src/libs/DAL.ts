import { cache } from 'react';
import { getSession, verifySession } from './Session';
import 'server-only';

// Verify session and return user data
export const verifyUserSession = cache(async () => {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return {
    userId: session.userId,
    userEmail: session.userEmail,
    walletAddress: session.walletAddress,
    stripeCustomerId: session.stripeCustomerId,
    dimoToken: session.dimoToken,
    subOrganizationId: session.subOrganizationId,
  };
});

// Get user data with authentication check
export const getUser = cache(async () => {
  const session = await verifySession();

  return {
    id: session.userId,
    email: session.userEmail,
    walletAddress: session.walletAddress,
    stripeCustomerId: session.stripeCustomerId,
    dimoToken: session.dimoToken,
    subOrganizationId: session.subOrganizationId,
  };
});

// Check if user is authenticated (for conditional rendering)
export const isAuthenticated = cache(async () => {
  const session = await getSession();
  return !!session;
});
