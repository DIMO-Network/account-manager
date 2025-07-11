'use client';

import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export type AuthUser = {
  id: string;
  email: string;
  walletAddress?: string;
  isClerkUser: boolean;
};

export function useAuth() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();
  const router = useRouter();

  const user: AuthUser | null = clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        walletAddress: clerkUser.publicMetadata?.walletAddress as string,
        isClerkUser: true,
      }
    : null;

  const signOut = async () => {
    await clerkSignOut();
    router.push('/sign-in');
  };

  return {
    user,
    isLoading: !clerkLoaded,
    isSignedIn: !!user,
    isClerkUser: !!clerkUser,
    signOut,
  };
}
