'use client';

import { useSearchParams } from 'next/navigation';
import { DimoSignIn } from './DimoSignIn';

export const SignInContent = () => {
  const searchParams = useSearchParams();

  const error = searchParams.get('error');
  const message = searchParams.get('message');
  const details = searchParams.get('details');

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">
            {error === 'dimo_failed' && 'DIMO authentication failed. Please try again.'}
            {error === 'auth_failed' && 'Authentication failed. Please try again.'}
            {error === 'missing_code' && 'Authentication response was incomplete. Please try again.'}
            {error === 'missing_token_or_email' && 'DIMO authentication incomplete - missing token or email.'}
            {!['dimo_failed', 'auth_failed', 'missing_code', 'missing_token_or_email'].includes(error) && 'An error occurred during sign-in. Please try again.'}
          </p>
          {details && (
            <p className="text-red-600 text-xs mt-2">
              Details:
              {' '}
              {decodeURIComponent(details)}
            </p>
          )}
        </div>
      )}

      {message && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800 text-sm">
            {message === 'dimo_registered' && 'Account created successfully! Signing you in...'}
            {message === 'dimo_updated' && 'Account updated with DIMO data! Signing you in...'}
          </p>
        </div>
      )}

      <DimoSignIn />
    </div>
  );
};
