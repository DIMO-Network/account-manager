'use client';

import { LayoutWrapper } from '@/components/Layout';
import type { AuthNavigationTranslations } from '@/components/Layout';

type PaymentMethodsLayoutClientProps = {
  children: React.ReactNode;
  translations: AuthNavigationTranslations;
};

export function PaymentMethodsLayoutClient({ children, translations }: PaymentMethodsLayoutClientProps) {
  return (
    <LayoutWrapper layoutType="auth" translations={translations}>
      {children}
    </LayoutWrapper>
  );
}
