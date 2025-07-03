import type { MenuItemConfig } from '@/types/menu';
import { SignOutButton } from '@clerk/nextjs';
import { HomeIcon, LogoutIcon, SettingsIcon, WalletIcon } from '@/components/Icons';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { MenuActionButton } from '@/components/Menu/MenuActionButton';

export type AuthNavigationTranslations = {
  dashboard_link: string;
  payment_methods_link: string;
  user_profile_link: string;
  sign_out: string;
  subscriptions_link: string;
};

export type PublicNavigationTranslations = {
  home_link: string;
  sign_in_link: string;
};

export const createAuthNavigation = (translations: AuthNavigationTranslations): MenuItemConfig[] => [
  // Main menu items
  {
    label: translations.dashboard_link,
    icon: HomeIcon,
    iconClassName: 'h-5 w-5',
    link: '/dashboard/',
    section: 'main',
  },
  {
    label: translations.subscriptions_link,
    icon: WalletIcon,
    iconClassName: 'h-5 w-5',
    link: '/subscriptions/',
    section: 'main',
  },
  {
    label: translations.payment_methods_link,
    icon: WalletIcon,
    iconClassName: 'h-5 w-5',
    link: '/payment-methods/',
    section: 'main',
  },
  {
    label: translations.user_profile_link,
    icon: SettingsIcon,
    iconClassName: 'h-5 w-5',
    link: '/user-profile/',
    section: 'main',
  },
  // Bottom navigation items
  {
    label: translations.sign_out,
    icon: LogoutIcon,
    iconClassName: 'h-5 w-5',
    component: (
      <SignOutButton>
        <MenuActionButton>
          <LogoutIcon className="h-5 w-5" />
          {translations.sign_out}
        </MenuActionButton>
      </SignOutButton>
    ),
    section: 'bottom',
  },
  {
    label: 'Locale',
    component: <LocaleSwitcher />,
    section: 'bottom',
  },
];

export const createPublicNavigation = (translations: PublicNavigationTranslations): MenuItemConfig[] => [
  // Main menu items
  {
    label: translations.home_link,
    icon: HomeIcon,
    iconClassName: 'h-5 w-5',
    link: '/',
    section: 'main',
  },
  // Bottom navigation items
  {
    label: translations.sign_in_link,
    link: '/sign-in/',
    section: 'bottom',
  },
  {
    label: 'Locale',
    component: <LocaleSwitcher />,
    section: 'bottom',
  },
];
