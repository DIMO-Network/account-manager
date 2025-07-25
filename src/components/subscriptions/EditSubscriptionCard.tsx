'use client';

import type Stripe from 'stripe';
import type { VehicleDetail } from '@/app/actions/getDimoVehicleDetails';
import type { ProductPrice } from '@/app/actions/getProductPrices';
import type { StripeSubscription } from '@/types/subscription';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { CarIcon } from '@/components/Icons';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';
import { formatProductName } from './utils/subscriptionDisplayHelpers';

type EditSubscriptionCardProps = {
  subscription: StripeSubscription;
  vehicleInfo?: VehicleDetail;
  productName: string;
  vehicleDisplay: string;
  productPrices: ProductPrice[];
  nextScheduledPrice?: Stripe.Price | null;
  nextScheduledDate?: number | null;
};

export const EditSubscriptionCard: React.FC<EditSubscriptionCardProps> = ({
  subscription,
  vehicleInfo: _vehicleInfo,
  productName,
  vehicleDisplay,
  productPrices,
  nextScheduledPrice,
  nextScheduledDate,
}) => {
  const t = useTranslations('Subscriptions.interval');
  const router = useRouter();

  const currentPriceId = subscription?.items?.data?.[0]?.price?.id;
  // If there's a scheduled price, use that as the default selection
  const defaultPriceId = nextScheduledPrice?.id || currentPriceId;
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(defaultPriceId || null);
  const isCanceled = subscription.cancel_at !== null;

  // Sort productPrices so scheduled price (or current subscription) is always first
  const sortedProductPrices = [...productPrices].sort((a, b) => {
    if (a.id === defaultPriceId) {
      return -1;
    }
    if (b.id === defaultPriceId) {
      return 1;
    }
    return 0;
  });

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
      isCurrent: price.id === currentPriceId,
    };
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const handlePriceSelect = (priceId: string) => {
    setSelectedPriceId(priceId);
  };

  const handleContinue = () => {
    if (selectedPriceId) {
      const url = new URL(window.location.href);
      url.searchParams.set('step', 'confirm');
      url.searchParams.set('priceId', selectedPriceId);
      router.push(url.toString());
    }
  };

  // For canceled subscriptions, allow any selection.
  // For active subscriptions with scheduled changes, require different selection
  // For active subscriptions without scheduled changes, require different selection
  const effectiveCurrentPriceId = nextScheduledPrice?.id || currentPriceId;
  const hasValidSelection = selectedPriceId && (
    isCanceled
    || selectedPriceId !== effectiveCurrentPriceId
  );

  return (
    <>
      <div className="flex flex-row items-center gap-2 border-b border-gray-700 pb-2 mb-4">
        <CarIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
        <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Edit Subscription</h1>
      </div>
      <div className="flex flex-col justify-between bg-surface-default rounded-2xl py-3">
        <div className="mb-8 px-4">
          <h3 className="font-medium text-base leading-6">
            {isCanceled ? 'Reactivate your subscription for' : 'Select your renewal plan for'}
            {' '}
            {formatProductName(productName)}
            {' '}
            connected to
            {' '}
            {vehicleDisplay}
            {nextScheduledDate && !isCanceled && (
              <>
                {' '}
                starting on
                {' '}
                {formatDate(nextScheduledDate)}
              </>
            )}
          </h3>
        </div>
        <div className="flex flex-col px-4 gap-3 mb-4">
          {sortedProductPrices.map((price) => {
            const { displayText, priceFormatted, isCurrent } = formatPrice(price);
            const isSelected = price.id === selectedPriceId;
            const isScheduled = nextScheduledPrice?.id === price.id;

            return (
              <button
                key={price.id}
                type="button"
                className={`relative p-4 rounded-xl border border-surface-raised transition-all duration-200 cursor-pointer w-full text-left min-h-20 bg-surface-raised ${
                  isSelected
                    ? 'border-white'
                    : 'border-gray-700'
                }`}
                onClick={() => handlePriceSelect(price.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePriceSelect(price.id);
                  }
                }}
                aria-pressed={isSelected}
                aria-describedby={isCurrent ? 'current-plan' : undefined}
              >
                {isCurrent && !isCanceled && isScheduled && (
                  <div
                    id="current-plan"
                    className="absolute -top-4 right-4 px-3 py-1 leading-6 rounded-full text-xs font-medium text-black bg-pill-gradient uppercase tracking-wider"
                  >
                    Current
                  </div>
                )}
                {isCurrent && isCanceled && !isScheduled && (
                  <div
                    className="absolute -top-4 right-4 px-3 py-1 leading-6 rounded-full text-xs font-medium text-black bg-pill-gradient uppercase tracking-wider"
                  >
                    Previous
                  </div>
                )}
                {isScheduled && (
                  <div
                    className="absolute -top-4 right-4 px-3 py-1 leading-6 rounded-full text-xs font-medium text-black bg-pill-gradient uppercase tracking-wider"
                  >
                    Scheduled
                  </div>
                )}

                <div className="flex flex-col">
                  <div className="font-medium text-base">
                    {displayText}
                  </div>
                  <div className="text-sm text-text-secondary">{priceFormatted}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-4">
          <button
            onClick={handleContinue}
            className={`${RESPONSIVE.touch} ${BORDER_RADIUS.full} font-medium w-full ${
              hasValidSelection
                ? COLORS.button.primary
                : COLORS.button.disabled
            }`}
            type="button"
            disabled={!hasValidSelection}
          >
            Continue to Review
          </button>
          <button
            onClick={() => router.push(`/subscriptions/${subscription.id}`)}
            className={`${RESPONSIVE.touch} ${COLORS.button.tertiary} ${BORDER_RADIUS.full} font-medium w-full mt-2`}
            type="button"
          >
            Go Back
          </button>
        </div>
      </div>
    </>
  );
};

export default EditSubscriptionCard;
