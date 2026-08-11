import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { DimoAuthWrapper } from '@/components/auth/DimoAuthWrapper';
import { DelegateClient } from './DelegateClient';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Delegate',
  });

  return {
    title: t('meta_title'),
  };
}

async function DelegateContent(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: 'Delegate',
  });

  return (
    <DelegateClient
      translations={{
        title: t('title'),
        description: t('description'),
      }}
    />
  );
}

export default async function DelegatePage(props: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <DimoAuthWrapper>
      <Suspense>
        <DelegateContent params={props.params} />
      </Suspense>
    </DimoAuthWrapper>
  );
}
