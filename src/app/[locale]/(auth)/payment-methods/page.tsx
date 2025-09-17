import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { getPaymentMethods } from '@/app/actions/getPaymentMethods';
import { getOrCreateStripeCustomer } from '@/app/actions/getStripeCustomer';
import { WalletIcon } from '@/components/Icons';
import { PaymentMethodsListClient } from '@/components/payment/PaymentMethodsListClient';
import { PageHeader } from '@/components/ui';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';

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
  const customerResult = await getOrCreateStripeCustomer();

  if (!customerResult.success || !customerResult.customerId) {
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
        <div className="text-center py-8">
          <p className="text-gray-500">Unable to load payment methods</p>
        </div>
      </div>
    );
  }

  try {
    const { paymentMethods, defaultPaymentMethodId } = await getPaymentMethods(customerResult.customerId);

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
        <PaymentMethodsListClient
          paymentMethods={paymentMethods}
          defaultPaymentMethodId={defaultPaymentMethodId || null}
          customerId={customerResult.customerId}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading payment methods:', error);
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
        <div className="text-center py-8">
          <p className="text-gray-500">Error loading payment methods</p>
        </div>
      </div>
    );
  }
}
