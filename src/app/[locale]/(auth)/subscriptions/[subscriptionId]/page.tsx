import { notFound } from 'next/navigation';
import { getDimoVehicleDetails } from '@/app/actions/getDimoVehicleDetails';
import SubscriptionDetailCard from '@/components/subscription/SubscriptionDetailCard';
import { stripe } from '@/libs/Stripe';
import { PaymentMethodSection } from '../PaymentMethodSection';

export default async function SubscriptionDetailPage({ params }: { params: Promise<{ subscriptionId: string }> }) {
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
        <SubscriptionDetailCard subscription={subscription} vehicleInfo={vehicleInfo} />
      </div>
      <PaymentMethodSection />
    </div>
  );
}
