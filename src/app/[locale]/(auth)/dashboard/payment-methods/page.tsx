import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PaymentMethodsList } from '@/components/payment/PaymentMethodsList';

type PaymentMethodsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: PaymentMethodsPageProps) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'PaymentMethods',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function PaymentMethodsPage(props: PaymentMethodsPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: 'PaymentMethods',
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-600 mt-2">
          {t('description')}
        </p>
      </div>

      <PaymentMethodsList />
    </div>
  );
}
