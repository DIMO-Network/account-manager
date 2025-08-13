import { notFound, redirect } from 'next/navigation';
import { ConnectionPlanSelection } from '@/components/subscriptions/connection/ConnectionPlanSelection';
import { getSession } from '@/libs/Session';
import { authorizeConnectionSubscriptionAccess } from '@/libs/StripeSubscriptionService';
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

  // Get current session and check authorization
  const session = await getSession();
  if (!session) {
    notFound();
  }

  const dimoToken = session.dimoToken;
  if (!dimoToken) {
    notFound();
  }

  // Check authorization and get subscription data
  const authResult = await authorizeConnectionSubscriptionAccess(vehicleTokenId, dimoToken);

  if (!authResult.authorized) {
    redirect('/dashboard');
  }

  const { subscription } = authResult;

  if (!subscription) {
    notFound();
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-3/4">
        <ConnectionPlanSelection subscription={subscription} vehicleTokenId={vehicleTokenId} />
      </div>
      <PaymentMethodSection />
    </div>
  );
}
