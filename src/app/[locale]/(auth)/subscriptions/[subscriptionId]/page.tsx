import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import SubscriptionDetailCard from '@/components/subscriptions/SubscriptionDetailCard';
import { authorizeSubscriptionAccess } from '@/libs/BackendSubscriptionService';
import { getSession } from '@/libs/Session';
import { fetchSubscriptionWithSchedule } from '@/libs/StripeSubscriptionService';
import { PaymentMethodSection } from '../PaymentMethodSection';

export default async function SubscriptionDetailPage({ params }: { params: Promise<{ subscriptionId: string }> }) {
  const { subscriptionId } = await params;

  if (!subscriptionId) {
    notFound();
  }

  // Get current session and check authorization
  const session = await getSession();
  if (!session) {
    notFound();
  }

  const dimoToken = session.dimoToken;
  const jwtToken = (await cookies()).get('dimo_jwt')?.value;
  const authResult = await authorizeSubscriptionAccess(subscriptionId, dimoToken, jwtToken);
  if (!authResult.authorized) {
    redirect('/dashboard');
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
