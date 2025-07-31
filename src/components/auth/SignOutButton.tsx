'use client';

import { useClerk } from '@clerk/nextjs';
import React from 'react';

// Custom sign out component that clears JWT cookie
export function SignOutButton({ children }: { children: React.ReactNode }) {
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    // Clear the JWT cookie
    document.cookie = 'dimo_jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    // Sign out from Clerk
    await signOut({ redirectUrl: '/sign-in' });
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
