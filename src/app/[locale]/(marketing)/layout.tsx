import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MarketingLayoutClient } from './MarketingLayoutClient';

export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: 'RootLayout',
  });

  return (
    <MarketingLayoutClient
      translations={{
        home_link: t('home_link'),
        sign_in_link: t('sign_in_link'),
      }}
    >
      {props.children}
    </MarketingLayoutClient>
  );
}
