import { notFound, redirect } from 'next/navigation';
import { DevicePlanSelection } from '@/components/subscriptions/device/DevicePlanSelection';
import { authorizeDeviceSubscriptionAccess } from '@/libs/BackendSubscriptionService';
import { getSession } from '@/libs/Session';
import { PaymentMethodSection } from '../../../PaymentMethodSection';

export default async function EditDeviceSubscriptionPage({
  params,
}: {
  params: Promise<{ deviceTokenId: string }>;
}) {
  const { deviceTokenId } = await params;

  if (!deviceTokenId) {
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
  const authResult = await authorizeDeviceSubscriptionAccess(deviceTokenId, dimoToken);

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
        <DevicePlanSelection subscription={subscription} deviceTokenId={deviceTokenId} />
      </div>
      <PaymentMethodSection />
    </div>
  );
}
