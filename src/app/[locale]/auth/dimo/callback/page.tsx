'use client';

import { DimoAuthWrapper } from '@/components/auth/DimoAuthWrapper';
import { useDimoAuthState } from '@dimo-network/login-with-dimo';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

function DimoCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, email, walletAddress, getValidJWT } = useDimoAuthState();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleCallback = async () => {
      // Check for error parameters first
      const error = searchParams.get('error');
      if (error) {
        console.error('DIMO auth error:', error);
        router.push('/sign-up?error=dimo_failed');
        return;
      }

      // Wait a moment for DIMO auth state to update
      await new Promise<void>((resolve) => {
        timeoutId = setTimeout(resolve, 1000);
      });

      if (isAuthenticated && email) {
        try {
          const jwt = getValidJWT();

          // Determine if this is a sign-in or sign-up based on the referring page or session storage
          const isSignIn
            = document.referrer.includes('/sign-in')
              || sessionStorage.getItem('dimo_flow') === 'sign-in';

          // Clear the flow indicator
          sessionStorage.removeItem('dimo_flow');

          console.warn('Processing DIMO auth - isSignIn:', isSignIn, 'email:', email);

          // Register/update user with your backend
          const response = await fetch('/api/auth/dimo/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              walletAddress,
              dimoToken: jwt,
              sharedVehicles: [], // Add if you have this data
              isSignIn,
            }),
          });

          const result = await response.json();
          console.warn('API response:', result);

          if (response.ok) {
            if (isSignIn) {
              // Sign-in flow: Always redirect to dashboard (create account if needed)
              if (result.signInToken) {
                console.warn('Auto-signing in with token and redirecting to dashboard');
                // Auto sign-in with token - this will take them to dashboard
                window.location.href = `/sign-in#/factor-one?redirect_url=${encodeURIComponent('/dashboard')}&token=${result.signInToken}`;
                return;
              } else {
                console.warn('No sign-in token, redirecting to dashboard manually');
                // Fallback - redirect directly to dashboard
                router.push('/dashboard');
              }
            } else {
              // Sign-up flow: Redirect to sign-in page for manual completion
              if (result.user.isNewUser) {
                router.push(`/sign-in?email_address=${encodeURIComponent(email)}&message=dimo_registered`);
              } else {
                // Existing user in sign-up flow - still redirect to sign-in
                router.push(`/sign-in?email_address=${encodeURIComponent(email)}&message=dimo_updated`);
              }
            }
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          console.error('Failed to process DIMO auth:', error);

          // Determine which page to redirect to based on the flow
          const isSignInFlow
            = document.referrer.includes('/sign-in')
              || sessionStorage.getItem('dimo_flow') === 'sign-in';

          const errorPage = isSignInFlow ? 'sign-in' : 'sign-up';
          const errorParam = isSignInFlow ? 'signin_failed' : 'registration_failed';

          router.push(`/${errorPage}?error=${errorParam}`);
        }
      } else {
        // No auth detected, redirect back to sign up
        router.push('/sign-up?error=auth_incomplete');
      }

      setIsProcessing(false);
    };

    handleCallback();

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAuthenticated, email, walletAddress, router, searchParams, getValidJWT]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-xl font-semibold mt-4">Processing DIMO Authentication...</h2>
          <p className="text-gray-600 mt-2">Please wait while we complete your authentication.</p>
        </div>
      </div>
    );
  }

  return null;
}

// Single default export with wrapper
export default function WrappedDimoCallback() {
  return (
    <DimoAuthWrapper>
      <DimoCallback />
    </DimoAuthWrapper>
  );
}
