import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { DimoAuthWrapper } from '@/components/auth/DimoAuthWrapper';
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
    <DimoAuthWrapper>
      <Suspense
        fallback={(
          <div className="space-y-8 p-6">
            <div className="animate-pulse bg-gray-900 rounded mb-4"></div>
            <div className="animate-pulse bg-gray-900 h-32"></div>
          </div>
        )}
      >
        <RecoveryClient
          translations={{
            title: t('title'),
            description: t('description'),
            coming_soon: t('coming_soon'),
          }}
        />
      </Suspense>
    </DimoAuthWrapper>
  );
}
