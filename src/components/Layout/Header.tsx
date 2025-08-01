'use client';

import type { FC } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { UserIcon } from '@/components/Icons/UserIcon';
import { COLORS } from '@/utils/designSystem';

export const Header: FC = () => {
  const { user } = useUser();
  return (
    <header className={`
      flex items-center justify-between h-12 md:h-16 px-2 md:px-6 py-6
      ${COLORS.background.primary} 
      rounded-2xl w-full
    `}
    >
      <Link href="/dashboard" className={`text-2xl font-black ${COLORS.text.primary}`}>
        Subscriptions
      </Link>
      {user?.primaryEmailAddress?.emailAddress && (
        <span
          className={`hidden md:flex items-center gap-2 rounded-full p-1 md:pr-3 ${COLORS.background.secondary}`}
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-700">
            <UserIcon className="w-4 h-4 text-white" />
          </span>
          <span className="hidden md:block text-sm font-medium truncate max-w-xs md:max-w-sm" title={user.primaryEmailAddress.emailAddress}>
            {user.primaryEmailAddress.emailAddress}
          </span>
        </span>
      )}
    </header>
  );
};
