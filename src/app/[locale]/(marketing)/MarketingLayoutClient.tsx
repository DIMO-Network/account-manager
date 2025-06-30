'use client';

import { LayoutWrapper, type MarketingNavigationTranslations } from '@/components/Layout';

type MarketingLayoutClientProps = {
  children: React.ReactNode;
  translations: MarketingNavigationTranslations;
};

export function MarketingLayoutClient({ children, translations }: MarketingLayoutClientProps) {
  return (
    <LayoutWrapper
      layoutType="marketing"
      translations={translations}
      className="py-5 text-xl [&_p]:my-6"
    >
      {children}
    </LayoutWrapper>
  );
}
