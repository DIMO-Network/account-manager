'use client';

import type { ReactNode } from 'react';
import type { AuthNavigationTranslations, PublicNavigationTranslations } from './index';
import { useBackendSubscriptions } from '@/hooks/useBackendSubscriptions';
import { createAuthNavigation, createPublicNavigation, SidebarLayout } from './index';

type LayoutWrapperProps = {
  children: ReactNode;
  layoutType: 'auth' | 'public';
  translations: AuthNavigationTranslations | PublicNavigationTranslations;
  className?: string;
};

export function LayoutWrapper({ children, layoutType, translations, className }: LayoutWrapperProps) {
  const { allStripeIdsNull } = useBackendSubscriptions();

  const menuItems = layoutType === 'auth'
    ? createAuthNavigation(translations as AuthNavigationTranslations, {
        hidePaymentMethods: allStripeIdsNull,
      })
    : createPublicNavigation(translations as PublicNavigationTranslations);

  return (
    <SidebarLayout menuItems={menuItems}>
      {className ? <div className={className}>{children}</div> : children}
    </SidebarLayout>
  );
}
