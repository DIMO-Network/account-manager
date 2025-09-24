'use client';

import type { ReactNode } from 'react';
import type { AuthNavigationTranslations, PublicNavigationTranslations } from './index';
import { useBackendSubscriptions } from '@/hooks/useBackendSubscriptions';
import { useStripeCustomer } from '@/hooks/useStripeCustomer';
import { createAuthNavigation, createPublicNavigation, SidebarLayout } from './index';

type LayoutWrapperProps = {
  children: ReactNode;
  layoutType: 'auth' | 'public';
  translations: AuthNavigationTranslations | PublicNavigationTranslations;
  className?: string;
};

export function LayoutWrapper({ children, layoutType, translations, className }: LayoutWrapperProps) {
  const { loading, allStripeIdsNull } = useBackendSubscriptions();
  const { customerId } = useStripeCustomer();

  // During loading: disable payment methods (visible but not clickable)
  // After loading: hide payment methods only if all stripe IDs are null
  const disablePaymentMethods = loading;
  const hidePaymentMethods = !loading && allStripeIdsNull;

  const menuItems = layoutType === 'auth'
    ? createAuthNavigation(translations as AuthNavigationTranslations, {
        hidePaymentMethods,
        disablePaymentMethods,
        customerId: customerId || undefined,
      })
    : createPublicNavigation(translations as PublicNavigationTranslations);

  return (
    <SidebarLayout menuItems={menuItems}>
      {className ? <div className={className}>{children}</div> : children}
    </SidebarLayout>
  );
}
