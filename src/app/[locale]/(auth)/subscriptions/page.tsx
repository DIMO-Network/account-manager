import type { EnhancedSubscription } from '@/utils/subscriptionHelpers';
import { getTranslations } from 'next-intl/server';
import { getOrCreateStripeCustomer } from '@/app/actions/getStripeCustomer';
import { fetchEnhancedSubscriptions } from '@/utils/subscriptionHelpers';
import { PaymentMethodSection } from './PaymentMethodSection';
import { SubscriptionsClient } from './SubscriptionsClient';

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

export default async function SubscriptionsPage() {
  const customerResult = await getOrCreateStripeCustomer();
  let subscriptions: EnhancedSubscription[] = [];

  if (customerResult.success && customerResult.customerId) {
    subscriptions = await fetchEnhancedSubscriptions(customerResult.customerId);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-3/4">
        <SubscriptionsClient subscriptions={subscriptions} />
      </div>
      <PaymentMethodSection />
    </div>
  );
}
