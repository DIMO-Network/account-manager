'use client';

import { useSearchParams } from 'next/navigation';
import { DimoSignIn } from './DimoSignIn';

export const SignInContent = () => {
  const searchParams = useSearchParams();

  const error = searchParams.get('error');
  const message = searchParams.get('message');

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">
            {error === 'dimo_failed' && 'DIMO authentication failed. Please try again.'}
            {error === 'signin_failed' && 'Sign in failed. Please try again.'}
            {error === 'no_account' && 'No account found with this email. Please sign up first.'}
          </p>
        </div>
      )}

      {message && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800 text-sm">
            {message === 'dimo_registered' && 'Account created successfully! Please sign in below.'}
            {message === 'dimo_updated' && 'Account updated with DIMO data! Please sign in below.'}
          </p>
        </div>
      )}

      <DimoSignIn />
    </div>
  );
};
