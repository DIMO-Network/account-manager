import { getTranslations } from 'next-intl/server';
import { SubscriptionsClient } from './SubscriptionsClient';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Subscriptions',
  });

  return {
    title: t('meta_title'),
  };
}

export default async function SubscriptionsPage() {
  return <SubscriptionsClient />;
}
