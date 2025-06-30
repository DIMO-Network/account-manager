'use client';

import Link from 'next/link';
import { HomeIcon } from '@/components/Icons';
import { SidebarLayout } from '@/components/Layout/SidebarLayout';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';

type MarketingLayoutClientProps = {
  children: React.ReactNode;
  translations: {
    home_link: string;
    sign_in_link: string;
  };
};

export function MarketingLayoutClient({ children, translations }: MarketingLayoutClientProps) {
  const mainMenu = [
    {
      label: translations.home_link,
      icon: HomeIcon,
      iconClassName: 'h-5 w-5',
      link: '/',
    },
  ];

  const rightNav = (
    <div className="flex flex-col gap-3">
      <Link
        href="/sign-in/"
        className="flex items-center gap-2 px-3 py-2 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors w-full"
      >
        {translations.sign_in_link}
      </Link>
      <LocaleSwitcher />
    </div>
  );

  return (
    <SidebarLayout
      mainMenu={mainMenu}
      rightNav={rightNav}
    >
      <div className="py-5 text-xl [&_p]:my-6">{children}</div>
    </SidebarLayout>
  );
}
