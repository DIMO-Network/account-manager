import type { BackendSubscription } from '@/types/subscription';
import type { StripeEnhancedSubscription } from '@/utils/subscriptionHelpers';
import { currentUser } from '@clerk/nextjs/server';
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { getOrCreateStripeCustomer } from '@/app/actions/getStripeCustomer';
import { WalletIcon } from '@/components/Icons';
import { PaymentMethodsNote } from '@/components/payment/PaymentMethodsNote';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';
import { featureFlags } from '@/utils/FeatureFlags';
import { fetchBackendSubscriptions, fetchEnhancedSubscriptions } from '@/utils/subscriptionHelpers';
import { PaymentMethodClient } from '../subscriptions/PaymentMethodClient';
import { SubscriptionsClient } from '../subscriptions/SubscriptionsClient';
import { PaymentMethodButtons } from './PaymentMethodButtons';

function PaymentMethodSection() {
  return (
    <div className="flex flex-col gap-4 lg:w-1/4 w-full order-1 lg:order-2">
      <div className="flex flex-row items-center gap-2 border-b border-gray-700 pb-2 lg:hidden">
        <WalletIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
        <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Payment Method</h1>
      </div>
      <div className={`flex flex-col justify-between ${BORDER_RADIUS.lg} ${COLORS.background.primary} py-3 px-4 lg:block min-h-24`}>
        <div className="flex flex-col">
          <div className="mb-4 hidden lg:block">
            <WalletIcon className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <PaymentMethodClient />
          </div>
        </div>
        <PaymentMethodButtons />
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

  if (!customerResult.success || !customerResult.customerId) {
    return (
      <div className="flex flex-col lg:flex-row gap-6">
        <PaymentMethodSection />
        <div className="w-full lg:w-3/4 order-2 lg:order-1">
          <div className="text-center py-8">
            <p className="text-gray-500">Unable to load subscriptions</p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch data based on feature flag
  let subscriptions: StripeEnhancedSubscription[] = [];
  let backendStatuses: BackendSubscription[] = [];

  if (featureFlags.useBackendProxy) {
    const dimoToken = (await cookies()).get('dimo_jwt')?.value
      || (await currentUser())?.privateMetadata?.dimoToken as string;

    if (dimoToken) {
      const result = await fetchBackendSubscriptions(dimoToken);
      backendStatuses = result || [];
    }
  } else {
    subscriptions = await fetchEnhancedSubscriptions(customerResult.customerId);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <PaymentMethodSection />
      <div className="w-full lg:w-3/4 order-2 lg:order-1">
        <SubscriptionsClient
          subscriptions={subscriptions}
          backendStatuses={backendStatuses}
        />
      </div>
    </div>
  );
}
