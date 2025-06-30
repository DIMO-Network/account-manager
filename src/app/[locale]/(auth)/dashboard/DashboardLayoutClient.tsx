'use client';

import { SignOutButton } from '@clerk/nextjs';
import { HomeIcon, LogoutIcon, SettingsIcon, WalletIcon } from '@/components/Icons';
import { SidebarLayout } from '@/components/Layout/SidebarLayout';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';

type DashboardLayoutClientProps = {
  children: React.ReactNode;
  translations: {
    dashboard_link: string;
    payment_methods_link: string;
    user_profile_link: string;
    sign_out: string;
  };
};

export function DashboardLayoutClient({ children, translations }: DashboardLayoutClientProps) {
  const mainMenu = [
    {
      label: translations.dashboard_link,
      icon: HomeIcon,
      iconClassName: 'h-5 w-5',
      link: '/dashboard/',
    },
    {
      label: translations.payment_methods_link,
      icon: WalletIcon,
      iconClassName: 'h-5 w-5',
      link: '/payment-methods/',
    },
    {
      label: translations.user_profile_link,
      icon: SettingsIcon,
      iconClassName: 'h-5 w-5',
      link: '/user-profile/',
    },
  ];

  const bottomNav = (
    <div className="flex flex-col gap-3">
      <SignOutButton>
        <button className="flex items-center gap-2 px-3 py-2 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors w-full" type="button">
          <LogoutIcon className="h-5 w-5" />
          {translations.sign_out}
        </button>
      </SignOutButton>
      <LocaleSwitcher />
    </div>
  );

  return (
    <SidebarLayout
      mainMenu={mainMenu}
      bottomNav={bottomNav}
    >
      {children}
    </SidebarLayout>
  );
}
