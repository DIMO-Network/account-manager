'use client';

import { LayoutWrapper, type PublicNavigationTranslations } from '@/components/Layout';

type PublicLayoutClientProps = {
  children: React.ReactNode;
  translations: PublicNavigationTranslations;
};

export function PublicLayoutClient({ children, translations }: PublicLayoutClientProps) {
  return (
    <LayoutWrapper
      layoutType="public"
      translations={translations}
      className="py-5 text-xl [&_p]:my-6"
    >
      {children}
    </LayoutWrapper>
  );
}
