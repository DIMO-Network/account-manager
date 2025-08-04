import { notFound } from 'next/navigation';
import GrandfatheredSubscriptionDetailCard from '@/components/subscriptions/GrandfatheredSubscriptionDetailCard';
import { getSession } from '@/libs/Session';
import { fetchBackendSubscriptions } from '@/libs/StripeSubscriptionService';
import { PaymentMethodSection } from '../../PaymentMethodSection';

export default async function GrandfatheredDeviceDetailPage({
  params,
}: {
  params: Promise<{ deviceTokenId: string }>;
}) {
  const { deviceTokenId } = await params;

  if (!deviceTokenId) {
    notFound();
  }

  try {
    const session = await getSession();
    if (!session) {
      notFound();
    }

    const dimoToken = session.dimoToken;
    if (!dimoToken) {
      notFound();
    }

    const backendSubscriptions = await fetchBackendSubscriptions(dimoToken);
    if (!backendSubscriptions) {
      notFound();
    }

    // Find the subscription that matches the device tokenId
    const subscription = backendSubscriptions.find(
      sub => sub.device?.tokenId === Number.parseInt(deviceTokenId, 10),
    );

    if (!subscription || !subscription.device) {
      notFound();
    }

    return (
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-3/4">
          <GrandfatheredSubscriptionDetailCard subscription={subscription} />
        </div>
        <PaymentMethodSection />
      </div>
    );
  } catch {
    notFound();
  }
}
