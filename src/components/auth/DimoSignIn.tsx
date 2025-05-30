'use client';

import { useSignIn } from '@clerk/nextjs';
import { LoginWithDimo, useDimoAuthState } from '@dimo-network/login-with-dimo';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export const DimoSignIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { email, walletAddress, getValidJWT } = useDimoAuthState();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDimoSuccess = async (authData: any) => {
    console.warn('DIMO Success - authData:', authData);

    setIsLoading(true);
    setError(null);

    try {
      // Get current DIMO auth state
      const dimoEmail = email;
      const dimoWallet = walletAddress;
      const dimoToken = getValidJWT();

      console.warn('DIMO Auth State:', { dimoEmail, dimoWallet, dimoToken: !!dimoToken });

      if (!dimoEmail || !dimoToken) {
        throw new Error('DIMO authentication incomplete - missing email or token');
      }

      // Sync user with backend
      console.warn('Making API call to register/sync user...');
      const response = await fetch('/api/auth/dimo/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: dimoEmail,
          walletAddress: dimoWallet,
          dimoToken,
        }),
      });

      const result = await response.json();
      console.warn('API Response:', result);

      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`);
      }

      // Use the sign-in token to authenticate with Clerk
      if (!isLoaded || !signIn) {
        throw new Error('Clerk not ready');
      }

      if (result.signInToken) {
        console.warn('Signing in with token...');

        const signInAttempt = await signIn.create({
          strategy: 'ticket',
          ticket: result.signInToken,
        });

        if (signInAttempt.status === 'complete') {
          await setActive({ session: signInAttempt.createdSessionId });
          console.warn('Successfully signed in, redirecting to dashboard...');
          router.push('/dashboard');
        } else {
          throw new Error('Sign-in incomplete');
        }
      } else {
        throw new Error('No sign-in token received');
      }
    } catch (error) {
      console.error('DIMO sign-in process failed:', error);
      setError(error instanceof Error ? error.message : 'Sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDimoError = (error: Error) => {
    console.error('DIMO auth failed:', error);
    setError('DIMO authentication failed. Please try again.');
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900">
          Sign in with DIMO
        </h3>
        <p className="text-gray-600">
          Access your account using your DIMO credentials
        </p>
      </div>

      <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
        <LoginWithDimo
          mode="popup"
          onSuccess={handleDimoSuccess}
          onError={handleDimoError}
          permissionTemplateId="2"
          authenticatedLabel="Access Dashboard"
          unAuthenticatedLabel="Sign in with DIMO"
          utm="utm_campaign=by_road_signin"
        />
      </div>

      {isLoading && (
        <div className="text-center text-sm text-gray-600 flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
          Signing you in...
        </div>
      )}
    </div>
  );
};
