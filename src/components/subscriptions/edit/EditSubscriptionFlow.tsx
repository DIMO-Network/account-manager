'use client';

import type Stripe from 'stripe';
import type { VehicleDetail } from '@/app/actions/getDimoVehicleDetails';
import type { CanceledTrialPreview, PreviewInvoice, ScheduledChangePreview, ScheduledSubscriptionPreview } from '@/app/actions/getPreviewInvoice';
import type { ProductPrice } from '@/app/actions/getProductPrices';
import type { StripeSubscription } from '@/types/subscription';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useTransition } from 'react';
import { EditConfirmationCard } from './EditConfirmationCard';
import { EditConfirmationCardSkeleton } from './EditConfirmationCardSkeleton';
import { EditSubscriptionCard } from './EditSubscriptionCard';
import { EditSubscriptionCardSkeleton } from './EditSubscriptionCardSkeleton';

type EditSubscriptionFlowProps = {
  subscription: StripeSubscription;
  vehicleInfo?: VehicleDetail;
  productName: string;
  vehicleDisplay: string;
  productPrices: ProductPrice[];
  nextScheduledPrice?: Stripe.Price | null;
  nextScheduledDate?: number | null;
  previewInvoiceMeta?: PreviewInvoice | ScheduledChangePreview | CanceledTrialPreview | ScheduledSubscriptionPreview;
};

export function EditSubscriptionFlow({
  subscription,
  vehicleInfo,
  productName,
  vehicleDisplay,
  productPrices,
  nextScheduledPrice,
  nextScheduledDate,
  previewInvoiceMeta,
}: EditSubscriptionFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();

  // Get current step from URL params
  const currentStep = searchParams.get('step');

  const handleStepChange = (step: string, priceId?: string) => {
    startTransition(() => {
      const url = new URL(window.location.href);

      if (step === 'confirm' && priceId) {
        url.searchParams.set('step', 'confirm');
        url.searchParams.set('priceId', priceId);
      } else {
        url.searchParams.delete('step');
        url.searchParams.delete('priceId');
      }

      router.push(url.toString());
    });
  };

  const handleBack = () => {
    startTransition(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete('step');
      url.searchParams.delete('priceId');
      router.push(url.toString());
    });
  };

  // Show loading skeleton during transitions
  if (isPending) {
    return currentStep === 'confirm'
      ? <EditSubscriptionCardSkeleton />
      : <EditConfirmationCardSkeleton />;
  }

  // Render appropriate step
  if (currentStep === 'confirm') {
    return (
      <EditConfirmationCard
        subscription={subscription}
        vehicleInfo={vehicleInfo}
        productName={productName}
        vehicleDisplay={vehicleDisplay}
        productPrices={productPrices}
        previewInvoiceMeta={previewInvoiceMeta}
        previewInvoice={previewInvoiceMeta}
        nextScheduledDate={nextScheduledDate}
        onBackAction={handleBack}
      />
    );
  }

  return (
    <EditSubscriptionCard
      subscription={subscription}
      vehicleInfo={vehicleInfo}
      productName={productName}
      vehicleDisplay={vehicleDisplay}
      productPrices={productPrices}
      nextScheduledPrice={nextScheduledPrice}
      nextScheduledDate={nextScheduledDate}
      onContinueAction={handleStepChange}
    />
  );
}
