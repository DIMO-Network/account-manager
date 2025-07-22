import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { WalletIcon } from '@/components/Icons';
import { PaymentMethodsList } from '@/components/payment/PaymentMethodsList';
import { COLORS } from '@/utils/designSystem';

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
    <div className="flex flex-col">
      <div className="flex flex-row items-center justify-between border-b border-gray-700 pb-2 mb-6">
        <div className="flex flex-row items-center gap-2">
          <WalletIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
          <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Payment Method</h1>
        </div>
        <Link
          href="/payment-methods/add"
          className="px-4 py-2 text-sm bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-colors"
        >
          Add a Card
        </Link>
      </div>
      <PaymentMethodsList />
    </div>
  );
}
