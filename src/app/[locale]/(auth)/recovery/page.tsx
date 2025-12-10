import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { DimoAuthWrapper } from '@/components/auth/DimoAuthWrapper';
import { RecoveryClient } from './RecoveryClient';

async function RecoveryContent(props: {
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

export default async function RecoveryPage(props: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <DimoAuthWrapper>
      <Suspense>
        <RecoveryContent params={props.params} />
      </Suspense>
    </DimoAuthWrapper>
  );
}
