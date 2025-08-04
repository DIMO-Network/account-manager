'use client';

import { useRouter } from 'next/navigation';
import React from 'react';

// Custom sign out component that clears session
export function SignOutButton({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      // Call our logout API (handles cookie deletion server-side)
      await fetch('/api/auth/logout', { method: 'POST' });

      router.push('/sign-in');
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/sign-in');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSignOut();
    }
  };

  return (
    <div
      onClick={handleSignOut}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className="w-full cursor-pointer"
      aria-label="Sign out"
    >
      {children}
    </div>
  );
}
