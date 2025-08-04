import type { BackendSubscription } from '@/types/subscription';
import type { StripeEnhancedSubscription } from '@/utils/subscriptionHelpers';
import { currentUser } from '@clerk/nextjs/server';
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { WalletIcon } from '@/components/Icons';
import { PaymentMethodsNote } from '@/components/payment/PaymentMethodsNote';
import { PageHeader } from '@/components/ui';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';
import { featureFlags } from '@/utils/FeatureFlags';
import { fetchBackendSubscriptions } from '@/utils/subscriptionHelpers';
import { PaymentMethodClient } from '../subscriptions/PaymentMethodClient';
import { DashboardContent } from './DashboardContent';
import { PaymentMethodButtons } from './PaymentMethodButtons';

function PaymentMethodSection() {
  return (
    <div className="flex flex-col gap-4 lg:w-1/4 w-full order-1 lg:order-2">
      <PageHeader
        icon={<WalletIcon />}
        title="Payment Method"
        className="lg:hidden"
      />
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
  // Fetch data based on feature flag
  const subscriptions: StripeEnhancedSubscription[] = [];
  let backendStatuses: BackendSubscription[] = [];

  if (featureFlags.useBackendProxy) {
    const dimoToken = (await cookies()).get('dimo_jwt')?.value
      || (await currentUser())?.privateMetadata?.dimoToken as string;

    if (dimoToken) {
      const result = await fetchBackendSubscriptions(dimoToken);
      backendStatuses = result || [];
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <PaymentMethodSection />
      <div className="w-full lg:w-3/4 order-2 lg:order-1">
        <DashboardContent
          initialSubscriptions={subscriptions}
          initialBackendStatuses={backendStatuses}
        />
      </div>
    </div>
  );
}
