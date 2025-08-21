import type { MenuItemConfig } from '@/types/menu';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { HomeIcon, LogoutIcon, WalletIcon } from '@/components/Icons';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { MenuActionButton } from '@/components/Menu/MenuActionButton';
import { isProductionMode } from '@/utils/FeatureFlags';

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

export const createAuthNavigation = (
  translations: AuthNavigationTranslations,
  options?: { hidePaymentMethods?: boolean },
): MenuItemConfig[] => {
  const isProduction = isProductionMode();

  const menuItems: MenuItemConfig[] = [
    // Main menu items
    {
      label: translations.subscriptions_link,
      icon: HomeIcon,
      iconClassName: 'h-5 w-5 text-text-secondary',
      link: '/dashboard/',
      section: 'main',
    },
  ];

  // Only add payment methods link if not hidden
  if (!options?.hidePaymentMethods) {
    menuItems.push({
      label: translations.payment_methods_link,
      icon: WalletIcon,
      iconClassName: 'h-5 w-5 text-text-secondary',
      link: '/payment-methods/',
      section: 'main',
    });
  }

  // Bottom navigation items
  menuItems.push(
    {
      label: translations.sign_out,
      icon: LogoutIcon,
      iconClassName: 'h-5 w-5 text-text-secondary',
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
  );

  // Show locale switcher if not in production mode
  if (!isProduction) {
    menuItems.push({
      label: 'Locale',
      component: <LocaleSwitcher />,
      section: 'bottom',
    });
  }

  return menuItems;
};

export const createPublicNavigation = (translations: PublicNavigationTranslations): MenuItemConfig[] => {
  const isProduction = isProductionMode();

  const menuItems: MenuItemConfig[] = [
    // Main menu items
    {
      label: translations.home_link,
      icon: HomeIcon,
      iconClassName: 'h-5 w-5 text-text-secondary',
      link: '/',
      section: 'main',
    },
  ];

  // Bottom navigation items
  menuItems.push({
    label: translations.sign_in_link,
    link: '/sign-in/',
    section: 'bottom',
  });

  // Only add locale switcher if not in production mode
  if (!isProduction) {
    menuItems.push({
      label: 'Locale',
      component: <LocaleSwitcher />,
      section: 'bottom',
    });
  }

  return menuItems;
};
