import { currentUser } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import ConnectionSubscriptionDetailCard from '@/components/subscriptions/ConnectionSubscriptionDetailCard';
import { fetchBackendSubscriptions } from '@/utils/subscriptionHelpers';
import { PaymentMethodSection } from '../../PaymentMethodSection';

export default async function ConnectionSubscriptionDetailPage({
  params,
}: {
  params: Promise<{ vehicleTokenId: string }>;
}) {
  const { vehicleTokenId } = await params;

  if (!vehicleTokenId) {
    notFound();
  }

  try {
    const user = await currentUser();
    if (!user) {
      notFound();
    }

    const dimoToken = user.privateMetadata?.dimoToken as string;
    if (!dimoToken) {
      notFound();
    }

    const backendSubscriptions = await fetchBackendSubscriptions(dimoToken);
    if (!backendSubscriptions) {
      notFound();
    }

    // Find the subscription that matches the vehicle tokenId and has a connection
    const subscription = backendSubscriptions.find(
      sub => sub.device?.vehicle?.tokenId === Number.parseInt(vehicleTokenId, 10) && sub.device?.connection?.name,
    );

    if (!subscription || !subscription.device) {
      notFound();
    }

    return (
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-3/4">
          <ConnectionSubscriptionDetailCard subscription={subscription} />
        </div>
        <PaymentMethodSection />
      </div>
    );
  } catch {
    notFound();
  }
}
