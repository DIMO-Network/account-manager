import { getTranslations, setRequestLocale } from 'next-intl/server';
import { RecoveryClient } from './RecoveryClient';

export default async function RecoveryPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: 'Recovery',
  });

  return (
    <RecoveryClient
      translations={{
        title: t('title'),
        description: t('description'),
        coming_soon: t('coming_soon'),
      }}
    />
  );
}
