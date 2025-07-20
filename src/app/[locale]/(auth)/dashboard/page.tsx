import type { EnhancedSubscription } from '@/utils/subscriptionHelpers';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { getOrCreateStripeCustomer } from '@/app/actions/getStripeCustomer';
import { WalletIcon } from '@/components/Icons';
import { PaymentMethodsNote } from '@/components/payment/PaymentMethodsNote';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';
import { fetchEnhancedSubscriptions } from '@/utils/subscriptionHelpers';
import { PaymentMethodClient } from '../subscriptions/PaymentMethodClient';
import { SubscriptionsClient } from '../subscriptions/SubscriptionsClient';

function PaymentMethodSection() {
  return (
    <div className="flex flex-col gap-4 lg:w-1/4 w-full order-1 lg:order-2">
      <div className="flex flex-row items-center gap-2 border-b border-gray-700 pb-2 lg:hidden">
        <WalletIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
        <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Payment Method</h1>
      </div>
      <div className={`flex flex-col justify-between ${BORDER_RADIUS.lg} ${COLORS.background.primary} py-3 px-4 lg:block min-h-36`}>
        <div className="flex flex-col">
          <div className="mb-4 hidden lg:block">
            <WalletIcon className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <PaymentMethodClient />
          </div>
        </div>
        <div className="mt-6 flex justify-center">
          <Link
            href="/payment-methods"
            className="inline-flex flex-row items-center justify-center gap-2 rounded-full bg-surface-raised px-4 font-medium w-full h-10"
          >
            Edit
          </Link>
        </div>
      </div>
      <PaymentMethodsNote />
    </div>
  );
}

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

export default async function DashboardPage() {
  const customerResult = await getOrCreateStripeCustomer();
  let subscriptions: EnhancedSubscription[] = [];

  if (customerResult.success && customerResult.customerId) {
    subscriptions = await fetchEnhancedSubscriptions(customerResult.customerId);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <PaymentMethodSection />
      <div className="w-full lg:w-3/4 order-2 lg:order-1">
        <SubscriptionsClient subscriptions={subscriptions} />
      </div>
    </div>
  );
}
