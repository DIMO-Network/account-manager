'use client';

import type { ReactNode } from 'react';
import { type AuthNavigationTranslations, createAuthNavigation, createPublicNavigation, type PublicNavigationTranslations, SidebarLayout } from './index';

type LayoutWrapperProps = {
  children: ReactNode;
  layoutType: 'auth' | 'public';
  translations: AuthNavigationTranslations | PublicNavigationTranslations;
  className?: string;
};

export function LayoutWrapper({ children, layoutType, translations, className }: LayoutWrapperProps) {
  const menuItems = layoutType === 'auth'
    ? createAuthNavigation(translations as AuthNavigationTranslations)
    : createPublicNavigation(translations as PublicNavigationTranslations);

  return (
    <SidebarLayout menuItems={menuItems}>
      {className ? <div className={className}>{children}</div> : children}
    </SidebarLayout>
  );
}
