import { notFound } from 'next/navigation';
import CancelSubscriptionCard from '@/components/subscription/CancelSubscriptionCard';
import { fetchSubscriptionWithSchedule } from '@/utils/subscriptionHelpers';
import { PaymentMethodSection } from '../../PaymentMethodSection';

export default async function CancelSubscriptionPage({ params }: { params: Promise<{ subscriptionId: string }> }) {
  const { subscriptionId } = await params;

  if (!subscriptionId) {
    notFound();
  }

  try {
    const { subscription, vehicleInfo, nextScheduledPrice, nextScheduledDate } = await fetchSubscriptionWithSchedule(subscriptionId);

    return (
      <div className="flex flex-col lg:flex-row gap-6 py-5">
        <div className="w-full lg:w-3/4">
          <CancelSubscriptionCard
            subscription={subscription}
            vehicleInfo={vehicleInfo}
            nextScheduledPrice={nextScheduledPrice}
            nextScheduledDate={nextScheduledDate}
          />
        </div>
        <PaymentMethodSection />
      </div>
    );
  } catch {
    notFound();
  }
}
