'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export type AuthUser = {
  id: string;
  email: string;
  walletAddress?: string;
  stripeCustomerId?: string;
  dimoToken: string;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsSignedIn(true);
        } else {
          setUser(null);
          setIsSignedIn(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setIsSignedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setIsSignedIn(false);
      router.push('/sign-in');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return {
    user,
    isLoading,
    isSignedIn,
    signOut,
  };
}
