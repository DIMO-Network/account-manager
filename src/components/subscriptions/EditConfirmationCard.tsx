'use client';

import type { VehicleDetail } from '@/app/actions/getDimoVehicleDetails';
import type { PreviewInvoice, ScheduledChangePreview } from '@/app/actions/getPreviewInvoice';
import type { ProductPrice } from '@/app/actions/getProductPrices';
import type { StripeSubscription } from '@/types/subscription';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import { CarIcon } from '@/components/Icons';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';

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
    let perIntervalText = '';
    if (interval === 'month') {
      intervalText = t('monthly');
      perIntervalText = '/ month';
    } else if (interval === 'year') {
      intervalText = t('annually');
      perIntervalText = '/ year';
    }

    return {
      displayText: intervalText,
      priceFormatted: `$${amount.toFixed(2)} ${perIntervalText}`,
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
      <>
        <div className="flex flex-row items-center gap-2 border-b border-gray-700 pb-2 mb-4">
          <CarIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
          <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Invalid Selection</h1>
        </div>
        <div className="flex flex-col justify-between bg-surface-default rounded-2xl py-3">
          <div className="px-4 mb-6">
            <p className="text-base leading-6">
              The selected price is not valid. Please go back and try again.
            </p>
          </div>
          <div className="px-4">
            <button
              onClick={handleBack}
              className={`${RESPONSIVE.touch} ${COLORS.button.tertiary} ${BORDER_RADIUS.full} font-medium w-full`}
              type="button"
            >
              Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  const currentFormatted = currentPrice ? formatPrice(currentPrice) : null;
  const selectedFormatted = formatPrice(selectedPrice);

  return (
    <>
      <div className="flex flex-row items-center gap-2 border-b border-gray-700 pb-2 mb-4">
        <CarIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
        <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Confirm Subscription Change</h1>
      </div>
      <div className="flex flex-col justify-between bg-surface-default rounded-2xl py-3">
        <div className="px-4 mb-8">
          <p className="text-base leading-6">
            Review your subscription change for
            {' '}
            {productName}
            {' '}
            connected to
            {' '}
            {vehicleDisplay}
            .
          </p>
        </div>

        {/* Current vs New Plan Comparison */}
        <div className="flex flex-col px-4 gap-6 mb-4">
          <div className="relative border border-surface-raised rounded-xl bg-surface-raised p-4">
            <div className="absolute -top-3 right-4 px-3 py-1 leading-6 rounded-full text-xs font-medium text-text-secondary bg-gray-700 uppercase tracking-wider">
              Current
            </div>
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <div className="font-medium text-base text-text-secondary">{currentFormatted?.displayText}</div>
                <div className="text-sm text-text-secondary">{currentFormatted?.priceFormatted}</div>
              </div>
            </div>
          </div>

          <div className="relative border border-surface-raised rounded-xl bg-surface-raised py-4">
            <div className="absolute -top-3 right-4 px-3 py-1 leading-6 rounded-full text-xs font-medium text-black bg-pill-gradient uppercase tracking-wider">
              New
            </div>
            <div className="flex flex-col px-4">
              <div className="font-medium text-base">{selectedFormatted.displayText}</div>
              <div className="font-medium text-sm">{selectedFormatted.priceFormatted}</div>
            </div>

            {/* Preview Charges */}
            {showScheduledChange
              ? (
                  <div className="border-t border-gray-700 mt-4 pt-4">
                    <h3 className="text-base font-medium leading-6 px-4">Note</h3>
                    <p className="text-sm leading-4.5 mt-1 text-text-secondary px-4">
                      Your plan will switch to
                      {' '}
                      <span className="font-medium">
                        $
                        {(previewInvoice as any).nextAmount / 100}
                        /
                        {(previewInvoice as any).nextInterval}
                      </span>
                      {' '}
                      on
                      {' '}
                      <span className="font-medium">{new Date((previewInvoice as any).nextDate * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      . You will not be charged until then.
                    </p>
                  </div>
                )
              : previewInvoice && (
                <div className="border-t border-gray-700 mt-4 pt-4">
                  <h3 className="font-medium text-base mb-3 px-4">Preview of Charges</h3>
                  <div className="flex flex-col gap-1">
                    {isPreviewInvoice(previewInvoice) && previewInvoice.lines?.data?.map((line: any) => (
                      <div key={line.id} className="flex justify-between text-sm px-4">
                        <span>{line.description}</span>
                        <span className="ml-3">
                          {line.amount < 0
                            ? `($${Math.abs(line.amount / 100).toFixed(2)})`
                            : `$${(line.amount / 100).toFixed(2)}`}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-gray-700 pt-4 mt-2">
                      <div className="flex justify-between font-medium px-4">
                        <span>Total</span>
                        <span>
                          $
                          {isPreviewInvoice(previewInvoice) ? (previewInvoice.total / 100).toFixed(2) : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Charge Date */}
                  {nextChargeDate
                    ? (
                        <div className="mt-4 pt-3 border-t border-gray-700 px-4">
                          <p className="text-sm leading-4.5 text-text-secondary">
                            After pressing confirm, your payment method will be charged on
                            {' '}
                            {new Date(nextChargeDate * 1000).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                            .
                          </p>
                        </div>
                      )
                    : (
                        <div className="mt-4 pt-3 border-t border-gray-700 px-4">
                          <p className="text-sm leading-4.5 text-text-secondary">
                            Your payment method will be charged immediately after pressing confirm.
                          </p>
                        </div>
                      )}
                </div>
              )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4">
          <button
            onClick={handleConfirm}
            className={`${RESPONSIVE.touch} ${BORDER_RADIUS.full} font-medium w-full ${
              isUpdating ? COLORS.button.disabled : COLORS.button.primary
            }`}
            disabled={isUpdating}
            type="button"
          >
            {isUpdating ? 'Updating...' : 'Confirm'}
          </button>
          <button
            onClick={handleBack}
            className={`${RESPONSIVE.touch} ${COLORS.button.tertiary} ${BORDER_RADIUS.full} font-medium w-full mt-2`}
            disabled={isUpdating}
            type="button"
          >
            Go Back
          </button>
        </div>
      </div>
    </>
  );
};

export default EditConfirmationCard;
