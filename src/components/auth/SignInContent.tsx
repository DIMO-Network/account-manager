'use client';

import { getI18nPath } from '@/utils/Helpers';
import { SignIn } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { DimoSignIn } from './DimoSignIn';

type SignInContentProps = {
  locale: string;
};

export const SignInContent = ({ locale }: SignInContentProps) => {
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

      <div>
        <h2 className="text-xl font-semibold mb-4">Sign in with Email</h2>
        <SignIn path={getI18nPath('/sign-in', locale)} />
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <DimoSignIn />
    </div>
  );
};
