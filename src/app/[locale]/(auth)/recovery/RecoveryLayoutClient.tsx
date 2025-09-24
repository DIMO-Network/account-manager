'use client';

import type { AuthNavigationTranslations } from '@/components/Layout';
import { LayoutWrapper } from '@/components/Layout';

type RecoveryLayoutClientProps = {
  children: React.ReactNode;
  translations: AuthNavigationTranslations;
};

export function RecoveryLayoutClient({ children, translations }: RecoveryLayoutClientProps) {
  return (
    <LayoutWrapper layoutType="auth" translations={translations}>
      {children}
    </LayoutWrapper>
  );
}
