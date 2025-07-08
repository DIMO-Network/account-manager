'use client';

import type { VehicleDetail } from '@/app/actions/getDimoVehicleDetails';
import type { PreviewInvoice, ScheduledChangePreview } from '@/app/actions/getPreviewInvoice';
import type { ProductPrice } from '@/app/actions/getProductPrices';
import type { StripeSubscription } from '@/types/subscription';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';

type EditConfirmationCardProps = {
  subscription: StripeSubscription;
  vehicleInfo?: VehicleDetail;
  productName: string;
  vehicleDisplay: string;
  productPrices: ProductPrice[];
  previewInvoice?: PreviewInvoice | ScheduledChangePreview;
  previewInvoiceMeta?: PreviewInvoice | ScheduledChangePreview;
};

export const EditConfirmationCard: React.FC<EditConfirmationCardProps> = ({
  subscription,
  vehicleInfo: _vehicleInfo,
  productName,
  vehicleDisplay,
  productPrices,
  previewInvoice,
  previewInvoiceMeta,
}) => {
  const t = useTranslations('Subscriptions.interval');
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPriceId = searchParams.get('priceId');

  const [isUpdating, setIsUpdating] = useState(false);

  const currentPriceId = subscription?.items?.data?.[0]?.price?.id;
  const currentPrice = productPrices.find(price => price.id === currentPriceId);
  const selectedPrice = productPrices.find(price => price.id === selectedPriceId);

  const formatPrice = (price: ProductPrice) => {
    const amount = price.unit_amount / 100;
    const interval = price.recurring.interval;

    let intervalText = '';
    if (interval === 'month') {
      intervalText = t('monthly');
    } else if (interval === 'year') {
      intervalText = t('annually');
    }

    return {
      displayText: intervalText,
      priceFormatted: `$${amount.toFixed(2)}`,
    };
  };

  const handleBack = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('step');
    url.searchParams.delete('priceId');
    router.push(url.toString());
  };

  const handleConfirm = async () => {
    if (!selectedPriceId) {
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch('/api/stripe/update-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          newPriceId: selectedPriceId,
          prorationDate: isPreviewInvoice(previewInvoiceMeta) ? previewInvoiceMeta.prorationDate : undefined,
        }),
      });
      const result = await res.json();

      if (result.success) {
        router.push(`/subscriptions/${subscription.id}`);
      } else {
        console.error('Failed to update subscription:', result.error);
        setIsUpdating(false);
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      setIsUpdating(false);
    }
  };

  // Type guard for PreviewInvoice
  function isPreviewInvoice(obj: PreviewInvoice | ScheduledChangePreview | undefined): obj is PreviewInvoice {
    return !!obj && 'id' in obj && 'lines' in obj;
  }

  const nextChargeDate = isPreviewInvoice(previewInvoiceMeta) ? previewInvoiceMeta.chargeDate : undefined;
  const showScheduledChange = previewInvoice && (previewInvoice as any).scheduledChange;

  if (!selectedPrice) {
    return (
      <div className="p-4 bg-surface-raised rounded-2xl">
        <h1 className="text-2xl font-bold mb-4">Invalid Selection</h1>
        <p className="text-base leading-6 mb-6">
          The selected price is not valid. Please go back and try again.
        </p>
        <button
          onClick={handleBack}
          className="w-full py-3 px-4 bg-gray-600 text-white rounded-full font-medium hover:bg-gray-700 transition-colors"
          type="button"
        >
          Go Back
        </button>
      </div>
    );
  }

  const currentFormatted = currentPrice ? formatPrice(currentPrice) : null;
  const selectedFormatted = formatPrice(selectedPrice);

  return (
    <div className="p-4 bg-surface-raised rounded-2xl flex flex-col justify-between">
      <h1 className="text-2xl font-bold mb-4">Confirm Subscription Change</h1>
      <div className="min-w-full bg-surface-default rounded-xl p-4">
        <p className="text-base leading-6 mb-6">
          Review your subscription change for
          {' '}
          {productName}
          {' '}
          connected to
          {' '}
          {vehicleDisplay}
          .
        </p>

        {/* Current vs New Plan Comparison */}
        <div className="space-y-4 mb-6">
          <div className="p-4 border border-gray-700 rounded-xl">
            <h3 className="font-medium text-sm text-gray-400 mb-2">Current Plan</h3>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-base">{currentFormatted?.displayText}</div>
                <div className="text-sm text-gray-400">{currentFormatted?.priceFormatted}</div>
              </div>
              <div className="text-lg font-bold">{currentFormatted?.priceFormatted}</div>
            </div>
          </div>

          <div className="p-4 border border-blue-500 bg-blue-900/20 rounded-xl">
            <h3 className="font-medium text-sm text-blue-400 mb-2">New Plan</h3>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-base">{selectedFormatted.displayText}</div>
                <div className="text-sm text-gray-400">{selectedFormatted.priceFormatted}</div>
              </div>
              <div className="text-lg font-bold">{selectedFormatted.priceFormatted}</div>
            </div>
          </div>
        </div>

        {/* Preview Charges */}
        {showScheduledChange
          ? (
              <div className="mb-6 p-4 border border-blue-500 bg-blue-900/20 rounded-xl">
                <h3 className="font-medium text-base mb-3">Plan Change Scheduled</h3>
                <p className="text-base leading-6">
                  Your plan will switch to
                  {' '}
                  <span className="font-bold">
                    $
                    {(previewInvoice as any).nextAmount / 100}
                    /
                    {(previewInvoice as any).nextInterval}
                  </span>
                  {' '}
                  on
                  {' '}
                  <span className="font-bold">{new Date((previewInvoice as any).nextDate * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  .
                  <br />
                  You will not be charged until then.
                </p>
              </div>
            )
          : previewInvoice && (
            <div className="mb-6 p-4 border border-gray-700 rounded-xl">
              <h3 className="font-medium text-base mb-3">Preview of Charges</h3>
              <div className="space-y-2">
                {isPreviewInvoice(previewInvoice) && previewInvoice.lines?.data?.map((line: any) => (
                  <div key={line.id} className="flex justify-between text-sm">
                    <span>{line.description}</span>
                    <span>
                      $
                      {(line.amount / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>
                      $
                      {isPreviewInvoice(previewInvoice) ? (previewInvoice.total / 100).toFixed(2) : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Charge Date */}
              {nextChargeDate && (
                <div className="mt-4 pt-3 border-t border-gray-700">
                  <p className="text-sm text-gray-400">
                    Your payment method will be charged on
                    {' '}
                    {new Date(nextChargeDate * 1000).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-full font-medium hover:bg-gray-700 transition-colors"
            disabled={isUpdating}
            type="button"
          >
            Go Back
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={isUpdating}
            type="button"
          >
            {isUpdating ? 'Updating...' : 'Confirm Change'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditConfirmationCard;
