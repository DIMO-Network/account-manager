import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { WalletIcon } from '@/components/Icons';
import { PaymentMethodsWrapper } from '@/components/payment/PaymentMethodsWrapper';
import { PageHeader } from '@/components/ui';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
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
      <PageHeader
        icon={<WalletIcon />}
        title="Payment Method"
        className="mb-6"
      >
        <Link
          href="/payment-methods/add"
          className={`${RESPONSIVE.touchSmall} px-4 py-2 text-sm ${COLORS.background.secondary} ${BORDER_RADIUS.full}`}
        >
          Add a Card
        </Link>
      </PageHeader>
      <PaymentMethodsWrapper />
    </div>
  );
}
