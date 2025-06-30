'use client';

import type { ReactNode } from 'react';
import { type AuthNavigationTranslations, createAuthNavigation, createMarketingNavigation, type MarketingNavigationTranslations, SidebarLayout } from './index';

type LayoutWrapperProps = {
  children: ReactNode;
  layoutType: 'auth' | 'marketing';
  translations: AuthNavigationTranslations | MarketingNavigationTranslations;
  className?: string;
};

export function LayoutWrapper({ children, layoutType, translations, className }: LayoutWrapperProps) {
  const menuItems = layoutType === 'auth'
    ? createAuthNavigation(translations as AuthNavigationTranslations)
    : createMarketingNavigation(translations as MarketingNavigationTranslations);

  return (
    <SidebarLayout menuItems={menuItems}>
      {className ? <div className={className}>{children}</div> : children}
    </SidebarLayout>
  );
}
