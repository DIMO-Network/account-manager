'use client';

import { useSignIn, useUser } from '@clerk/nextjs';
import { LoginWithDimo } from '@dimo-network/login-with-dimo';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Loading } from '@/components/Loading';

export const DimoSignIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasProcessedTokenRef = useRef<string | null>(null);
  const isAutoSignIn = searchParams.get('action') === 'auto-signin' && searchParams.get('token');

  // Handle auto sign-in from callback
  useEffect(() => {
    const handleAutoSignIn = async () => {
      const token = searchParams.get('token');
      const action = searchParams.get('action');

      // Skip if no token/action, or if we've already processed this token
      if (!token || action !== 'auto-signin' || hasProcessedTokenRef.current === token) {
        return;
      }

      // Skip if user is already signed in
      if (isSignedIn) {
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        url.searchParams.delete('action');
        url.searchParams.delete('timestamp');
        window.history.replaceState({}, '', url.pathname + url.search);
        router.push('/dashboard');
        return;
      }

      // Skip if Clerk is not loaded yet
      if (!isLoaded || !signIn) {
        return;
      }

      // Mark this token as being processed
      hasProcessedTokenRef.current = token;
      setIsLoading(true);
      setError(null);

      try {
        const signInAttempt = await signIn.create({
          strategy: 'ticket',
          ticket: token,
        });

        if (signInAttempt.status === 'complete') {
          await setActive({ session: signInAttempt.createdSessionId });

          // Clean up the URL
          const url = new URL(window.location.href);
          url.searchParams.delete('token');
          url.searchParams.delete('action');
          url.searchParams.delete('timestamp');
          window.history.replaceState({}, '', url.pathname + url.search);
          router.push('/dashboard');
        } else {
          throw new Error('Sign-in incomplete');
        }
      } catch (error) {
        console.error('Auto sign-in failed:', error);

        // Check if the error is because user is already signed in
        if (error instanceof Error && error.message.includes('already signed in')) {
          router.push('/dashboard');
        } else {
          setError(error instanceof Error ? error.message : 'Sign-in failed');
          // Reset the processed token on error so it can be retried
          hasProcessedTokenRef.current = null;
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure React has finished all updates
    const timeoutId = setTimeout(handleAutoSignIn, 100);
    return () => clearTimeout(timeoutId);
  }, [searchParams, isLoaded, signIn, setActive, router, isSignedIn]);

  // Redirect if already signed in (without token params)
  useEffect(() => {
    const hasTokenParams = searchParams.get('token') && searchParams.get('action');
    if (isSignedIn && !hasTokenParams) {
      router.push('/dashboard');
    }
  }, [isSignedIn, router, searchParams]);

  if (isLoading || isAutoSignIn) {
    return (
      <div className="space-y-4 max-w-72 mx-auto">
        <div className="text-center">
          <Loading className="mx-auto mb-4" />
          <h3 className="text-base font-medium leading-5">
            Signing you in...
          </h3>
          <p className="text-text-secondary leading-5 text-sm mt-1">
            Please wait while we complete your authentication.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-72 mx-auto">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="text-center">
        <h3 className="text-base font-medium leading-5">
          Sign in with DIMO
        </h3>
        <p className="text-sm text-text-secondary font-light leading-5 mt-1">
          Access your account using your DIMO credentials
        </p>
      </div>

      <LoginWithDimo
        mode="redirect"
        utm="utm_campaign=account_manager_signin"
      />
    </div>
  );
};
