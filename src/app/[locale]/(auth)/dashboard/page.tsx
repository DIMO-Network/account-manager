import { fetchBackendSubscriptions } from '@/libs/BackendSubscriptionService';
import { getSession } from '@/libs/Session';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import type { BackendSubscription } from '@/types/subscription';
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
  const session = await getSession();
  const dimoToken = (await cookies()).get('dimo_jwt')?.value || session?.dimoToken;
  let backendStatuses: BackendSubscription[] = [];

  if (dimoToken) {
    const result = await fetchBackendSubscriptions(dimoToken);
    backendStatuses = result || [];
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <PaymentMethodSection />
      <div className="w-full lg:w-3/4 order-2 lg:order-1">
        <DashboardContent
          initialBackendStatuses={backendStatuses}
        />
      </div>
    </div>
  );
}
