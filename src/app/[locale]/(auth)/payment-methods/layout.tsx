import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PaymentMethodsLayoutClient } from './PaymentMethodsLayoutClient';

export default async function PaymentMethodsLayout(props: {
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
    <PaymentMethodsLayoutClient
      translations={{
        dashboard_link: t('dashboard_link'),
        vehicles_link: t('vehicles_link'),
        subscriptions_link: t('subscriptions_link'),
        payment_methods_link: t('payment_methods_link'),
        user_profile_link: t('user_profile_link'),
        sign_out: t('sign_out'),
      }}
    >
      {props.children}
    </PaymentMethodsLayoutClient>
  );
}
