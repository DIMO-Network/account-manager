'use client';

import type { AuthNavigationTranslations } from '@/components/Layout';
import { LayoutWrapper } from '@/components/Layout';

type TransactionsLayoutClientProps = {
  children: React.ReactNode;
  translations: AuthNavigationTranslations;
};

export function TransactionsLayoutClient({ children, translations }: TransactionsLayoutClientProps) {
  return (
    <LayoutWrapper layoutType="auth" translations={translations}>
      {children}
    </LayoutWrapper>
  );
}
