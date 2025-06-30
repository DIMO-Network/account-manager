'use client';

import { type AuthNavigationTranslations, LayoutWrapper } from '@/components/Layout';

type DashboardLayoutClientProps = {
  children: React.ReactNode;
  translations: AuthNavigationTranslations;
};

export function DashboardLayoutClient({ children, translations }: DashboardLayoutClientProps) {
  return (
    <LayoutWrapper layoutType="auth" translations={translations}>
      {children}
    </LayoutWrapper>
  );
}
