import { currentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import SubscriptionDetailCard from '@/components/subscriptions/SubscriptionDetailCard';
import { authorizeSubscriptionAccess, fetchSubscriptionWithSchedule } from '@/utils/subscriptionHelpers';
import { PaymentMethodSection } from '../PaymentMethodSection';

export default async function SubscriptionDetailPage({ params }: { params: Promise<{ subscriptionId: string }> }) {
  const { subscriptionId } = await params;

  if (!subscriptionId) {
    notFound();
  }

  // Get current user and check authorization
  const user = await currentUser();
  if (!user) {
    notFound();
  }

  const dimoToken = user.privateMetadata?.dimoToken as string;
  const jwtToken = (await cookies()).get('dimo_jwt')?.value;
  const authResult = await authorizeSubscriptionAccess(subscriptionId, dimoToken, jwtToken);
  if (!authResult.authorized) {
    notFound();
  }

  try {
    const { subscription, vehicleInfo, nextScheduledPrice, nextScheduledDate } = await fetchSubscriptionWithSchedule(subscriptionId);

    return (
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-3/4">
          <SubscriptionDetailCard subscription={subscription} vehicleInfo={vehicleInfo} nextScheduledPrice={nextScheduledPrice} nextScheduledDate={nextScheduledDate} />
        </div>
        <PaymentMethodSection />
      </div>
    );
  } catch {
    notFound();
  }
}
