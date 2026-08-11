'use client';

import type { AuthNavigationTranslations } from '@/components/Layout';
import { LayoutWrapper } from '@/components/Layout';

type DelegateLayoutClientProps = {
  children: React.ReactNode;
  translations: AuthNavigationTranslations;
};

export function DelegateLayoutClient({ children, translations }: DelegateLayoutClientProps) {
  return (
    <LayoutWrapper layoutType="auth" translations={translations}>
      {children}
    </LayoutWrapper>
  );
}
