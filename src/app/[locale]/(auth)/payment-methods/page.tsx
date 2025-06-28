import { getTranslations } from 'next-intl/server';
import { PaymentMethodsList } from '@/components/payment/PaymentMethodsList';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'PaymentMethods',
  });

  return {
    title: t('meta_title'),
  };
}

export default async function PaymentMethods() {
  return (
    <div className="py-5 [&_p]:my-6">
      <PaymentMethodsList />
    </div>
  );
}
