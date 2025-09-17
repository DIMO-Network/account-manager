import { getTranslations, setRequestLocale } from 'next-intl/server';
import { TransactionsClient } from './TransactionsClient';

export default async function TransactionsPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: 'Transactions',
  });

  return (
    <TransactionsClient
      translations={{
        title: t('title'),
        loading: t('loading'),
        no_transactions: t('no_transactions'),
      }}
    />
  );
}
