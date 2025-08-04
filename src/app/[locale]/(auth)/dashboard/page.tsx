import type { BackendSubscription } from '@/types/subscription';
import type { StripeEnhancedSubscription } from '@/utils/subscriptionHelpers';
import { currentUser } from '@clerk/nextjs/server';
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { featureFlags } from '@/utils/FeatureFlags';
import { fetchBackendSubscriptions } from '@/utils/subscriptionHelpers';
import { DashboardContent } from './DashboardContent';
import { PaymentMethodSection } from './PaymentMethodSection';

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
