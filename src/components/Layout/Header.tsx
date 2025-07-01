'use client';

import type { FC } from 'react';
import { useUser } from '@clerk/nextjs';
import { COLORS, RESPONSIVE, SPACING } from '@/utils/designSystem';

export const Header: FC = () => {
  const { user } = useUser();
  return (
    <header className={`
      flex h-12 md:h-16 items-center justify-between px-2 md:px-6 
      ${COLORS.background.secondary} 
      rounded-2xl w-full ml-2.5 md:ml-0
      ${SPACING.sm}
    `}
    >
      <p className={`${RESPONSIVE.text.h2} font-black ${COLORS.text.primary}`}>
        Subscription
      </p>
      {user?.primaryEmailAddress?.emailAddress && (
        <span className="text-sm md:text-base text-grey-400 font-medium truncate max-w-xs md:max-w-sm" title={user.primaryEmailAddress.emailAddress}>
          {user.primaryEmailAddress.emailAddress}
        </span>
      )}
    </header>
  );
};
