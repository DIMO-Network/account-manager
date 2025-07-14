import type { PreviewInvoice, ScheduledChangePreview } from '@/app/actions/getPreviewInvoice';
import { notFound } from 'next/navigation';
import { getDimoVehicleDetails } from '@/app/actions/getDimoVehicleDetails';
import { getPreviewInvoice } from '@/app/actions/getPreviewInvoice';
import { getProductPrices } from '@/app/actions/getProductPrices';
import { EditConfirmationCard } from '@/components/subscriptions/EditConfirmationCard';
import { EditSubscriptionCard } from '@/components/subscriptions/EditSubscriptionCard';
import { stripe } from '@/libs/Stripe';
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

  let subscription = null;
  try {
    subscription = await stripe().subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    });
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
  let previewInvoiceMeta: PreviewInvoice | ScheduledChangePreview | undefined;
  if (step === 'confirm' && priceId) {
    const meta = await getPreviewInvoice(subscriptionId, priceId);
    previewInvoiceMeta = meta ?? undefined;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 py-5">
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
              />
            )
          : (
              <EditSubscriptionCard
                subscription={subscriptionData}
                vehicleInfo={vehicleInfo}
                productName={productName}
                vehicleDisplay={vehicleDisplay}
                productPrices={productPrices}
              />
            )}
      </div>
      <PaymentMethodSection />
    </div>
  );
}
