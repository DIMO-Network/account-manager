'use client';

import type { AuthNavigationTranslations } from '@/components/Layout';
import { LayoutWrapper } from '@/components/Layout';

type UserProfileLayoutClientProps = {
  children: React.ReactNode;
  translations: AuthNavigationTranslations;
};

export function UserProfileLayoutClient({ children, translations }: UserProfileLayoutClientProps) {
  return (
    <LayoutWrapper layoutType="auth" translations={translations}>
      {children}
    </LayoutWrapper>
  );
}
