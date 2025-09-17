'use client';

import { Loading } from '@/components/Loading';
import { useAuth } from '@/hooks/useAuth';
import { LoginWithDimo } from '@dimo-network/login-with-dimo';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export const DimoSignIn = () => {
  const { isSignedIn, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.push('/dashboard');
    }
  }, [isSignedIn, router]);

  if (isLoading) {
    const isSigningOut = action === 'signout';

    return (
      <div className="space-y-4 max-w-72 mx-auto">
        <div className="text-center">
          <Loading className="mx-auto mb-4" />
          <h3 className="text-base font-medium leading-5">
            {isSigningOut ? 'Signing you out...' : 'Signing you in...'}
          </h3>
          <p className="text-text-secondary leading-5 text-sm mt-1">
            {isSigningOut
              ? 'Please wait while we complete your sign out.'
              : 'Please wait while we complete your authentication.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-72 mx-auto">
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
