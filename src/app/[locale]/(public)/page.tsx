import { getTranslations } from 'next-intl/server';
import { PublicLayoutClient } from './PublicLayoutClient';

type IIndexProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: IIndexProps) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Index',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function Index(props: IIndexProps) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'RootLayout' });

  return (
    <PublicLayoutClient
      translations={{
        home_link: t('home_link'),
        sign_in_link: t('sign_in_link'),
      }}
    >
      <h1>
        Please sign in to continue 👋
      </h1>
    </PublicLayoutClient>
  );
};
