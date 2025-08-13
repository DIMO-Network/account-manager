import { notFound, redirect } from 'next/navigation';
import { ConnectionPlanSelection } from '@/components/subscriptions/connection/ConnectionPlanSelection';
import { getSession } from '@/libs/Session';
import { fetchBackendSubscriptions } from '@/libs/StripeSubscriptionService';
import { PaymentMethodSection } from '../../../PaymentMethodSection';

export default async function EditSubscriptionPage({
  params,
}: {
  params: Promise<{ vehicleTokenId: string }>;
}) {
  const { vehicleTokenId } = await params;

  if (!vehicleTokenId) {
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

    // Find the subscription that matches the vehicle tokenId and has either a connection or manufacturer
    const subscription = backendSubscriptions.find(
      sub => sub.device?.vehicle?.tokenId === Number.parseInt(vehicleTokenId, 10)
        && (sub.device?.connection?.name || sub.device?.manufacturer?.name),
    );

    if (!subscription || !subscription.device) {
      notFound();
    }

    // Only allow access to canceled subscriptions for reactivation
    if (subscription.status !== 'canceled') {
      redirect('/dashboard');
    }

    return (
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-3/4">
          <ConnectionPlanSelection subscription={subscription} vehicleTokenId={vehicleTokenId} />
        </div>
        <PaymentMethodSection />
      </div>
    );
  } catch {
    notFound();
  }
}
