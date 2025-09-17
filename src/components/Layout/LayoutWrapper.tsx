'use client';

import { useBackendSubscriptions } from '@/hooks/useBackendSubscriptions';
import type { ReactNode } from 'react';
import { createAuthNavigation, createPublicNavigation, SidebarLayout } from './index';
import type { AuthNavigationTranslations, PublicNavigationTranslations } from './index';

type LayoutWrapperProps = {
  children: ReactNode;
  layoutType: 'auth' | 'public';
  translations: AuthNavigationTranslations | PublicNavigationTranslations;
  className?: string;
};

export function LayoutWrapper({ children, layoutType, translations, className }: LayoutWrapperProps) {
  const { loading, allStripeIdsNull } = useBackendSubscriptions();

  // During loading: disable payment methods (visible but not clickable)
  // After loading: hide payment methods only if all stripe IDs are null
  const disablePaymentMethods = loading;
  const hidePaymentMethods = !loading && allStripeIdsNull;

  const menuItems = layoutType === 'auth'
    ? createAuthNavigation(translations as AuthNavigationTranslations, {
        hidePaymentMethods,
        disablePaymentMethods,
      })
    : createPublicNavigation(translations as PublicNavigationTranslations);

  return (
    <SidebarLayout menuItems={menuItems}>
      {className ? <div className={className}>{children}</div> : children}
    </SidebarLayout>
  );
}
