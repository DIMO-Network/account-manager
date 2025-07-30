import type { CanceledTrialPreview, PreviewInvoice, ScheduledChangePreview, ScheduledSubscriptionPreview } from '@/app/actions/getPreviewInvoice';
import { currentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getPreviewInvoice } from '@/app/actions/getPreviewInvoice';
import { getProductPrices } from '@/app/actions/getProductPrices';
import { EditConfirmationCard } from '@/components/subscriptions/EditConfirmationCard';
import { EditSubscriptionCard } from '@/components/subscriptions/EditSubscriptionCard';
import { authorizeSubscriptionAccess, fetchSubscriptionWithSchedule } from '@/utils/subscriptionHelpers';
import { PaymentMethodSection } from '../../PaymentMethodSection';

export default async function EditSubscriptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ subscriptionId: string }>;
  searchParams: Promise<{ step?: string; priceId?: string }>;
}) {
  const { subscriptionId } = await params;
  const { step, priceId } = await searchParams;

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
    redirect('/dashboard');
  }

  let subscription = null;
  let vehicleInfo;
  let nextScheduledPrice = null;
  let nextScheduledDate = null;

  try {
    // Use fetchSubscriptionWithSchedule to get subscription with schedule info
    const { subscription: subscriptionWithSchedule, vehicleInfo: fetchedVehicleInfo, nextScheduledPrice: scheduledPrice, nextScheduledDate: scheduledDate } = await fetchSubscriptionWithSchedule(subscriptionId);
    subscription = subscriptionWithSchedule;
    vehicleInfo = fetchedVehicleInfo;
    nextScheduledPrice = scheduledPrice;
    nextScheduledDate = scheduledDate;
  } catch {
    notFound();
  }

  // Serialize the subscription object to a plain object for Client Components
  const subscriptionData = JSON.parse(JSON.stringify(subscription));

  // Get product name and vehicle display
  const product = subscription?.items?.data?.[0]?.price?.product;
  const productName = typeof product === 'object' && product && 'name' in product ? product.name : `Subscription ${subscription.id}`;
  const vehicleDisplay = vehicleInfo?.definition?.year && vehicleInfo?.definition?.make && vehicleInfo?.definition?.model
    ? `${vehicleInfo.definition.year} ${vehicleInfo.definition.make} ${vehicleInfo.definition.model}`
    : subscription?.metadata?.vehicleTokenId || 'N/A';

  // Get product prices
  const productId = typeof product === 'object' && product && 'id' in product ? product.id : null;
  const productPrices = productId ? await getProductPrices(productId) : [];

  // Get preview invoice if on confirm step
  let previewInvoiceMeta: PreviewInvoice | ScheduledChangePreview | CanceledTrialPreview | ScheduledSubscriptionPreview | undefined;
  if (step === 'confirm' && priceId) {
    const meta = await getPreviewInvoice(subscriptionId, priceId);
    previewInvoiceMeta = meta ?? undefined;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-3/4">
        {step === 'confirm'
          ? (
              <EditConfirmationCard
                subscription={subscriptionData}
                vehicleInfo={vehicleInfo}
                productName={productName}
                vehicleDisplay={vehicleDisplay}
                productPrices={productPrices}
                previewInvoiceMeta={previewInvoiceMeta}
                previewInvoice={previewInvoiceMeta}
                nextScheduledDate={nextScheduledDate}
              />
            )
          : (
              <EditSubscriptionCard
                subscription={subscriptionData}
                vehicleInfo={vehicleInfo}
                productName={productName}
                vehicleDisplay={vehicleDisplay}
                productPrices={productPrices}
                nextScheduledPrice={nextScheduledPrice}
                nextScheduledDate={nextScheduledDate}
              />
            )}
      </div>
      <PaymentMethodSection />
    </div>
  );
}
