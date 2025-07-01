'use client';

import type { FC } from 'react';
import { useUser } from '@clerk/nextjs';
import { COLORS, RESPONSIVE } from '@/utils/designSystem';

export const Header: FC = () => {
  const { user } = useUser();
  return (
    <header className={`
      flex items-center justify-between h-12 md:h-16 px-2 md:px-6 py-6
      ${COLORS.background.secondary} 
      rounded-2xl w-full
    `}
    >
      <p className={`${RESPONSIVE.text.h2} font-black ${COLORS.text.primary}`}>
        Subscriptions
      </p>
      {user?.primaryEmailAddress?.emailAddress && (
        <span className="text-sm md:text-base text-grey-400 font-medium truncate max-w-xs md:max-w-sm" title={user.primaryEmailAddress.emailAddress}>
          {user.primaryEmailAddress.emailAddress}
        </span>
      )}
    </header>
  );
};
