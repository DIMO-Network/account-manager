import { getTranslations, setRequestLocale } from 'next-intl/server';
import { RecoveryLayoutClient } from './RecoveryLayoutClient';

export default async function RecoveryLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: 'DashboardLayout',
  });

  return (
    <RecoveryLayoutClient
      translations={{
        dashboard_link: t('dashboard_link'),
        subscriptions_link: t('subscriptions_link'),
        payment_methods_link: t('payment_methods_link'),
        transactions_link: t('transactions_link'),
        recovery_link: t('recovery_link'),
        user_profile_link: t('user_profile_link'),
        sign_out: t('sign_out'),
      }}
    >
      {props.children}
    </RecoveryLayoutClient>
  );
}
