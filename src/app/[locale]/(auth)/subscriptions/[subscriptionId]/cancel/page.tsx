import { notFound } from 'next/navigation';
import { getDimoVehicleDetails } from '@/app/actions/getDimoVehicleDetails';
import CancelSubscriptionCard from '@/components/subscription/CancelSubscriptionCard';
import { stripe } from '@/libs/Stripe';
import { PaymentMethodSection } from '../../PaymentMethodSection';

export default async function CancelSubscriptionPage({ params }: { params: Promise<{ subscriptionId: string }> }) {
  const { subscriptionId } = await params;

  if (!subscriptionId) {
    notFound();
  }

  let subscription = null;
  try {
    subscription = await stripe().subscriptions.retrieve(subscriptionId);
  } catch {
    notFound();
  }

  // Serialize the subscription object to a plain object for Client Components
  const subscriptionData = JSON.parse(JSON.stringify(subscription));

  // Get vehicleTokenId from subscription metadata
  const vehicleTokenId = subscription?.metadata?.vehicleTokenId;
  let vehicleInfo;
  if (vehicleTokenId) {
    const { vehicle } = await getDimoVehicleDetails(vehicleTokenId);
    vehicleInfo = vehicle;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 py-5">
      <div className="w-full lg:w-3/4">
        <CancelSubscriptionCard subscription={subscriptionData} vehicleInfo={vehicleInfo} />
      </div>
      <PaymentMethodSection />
    </div>
  );
}
