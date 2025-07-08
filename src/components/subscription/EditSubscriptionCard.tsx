'use client';

import type { VehicleDetail } from '@/app/actions/getDimoVehicleDetails';
import type { ProductPrice } from '@/app/actions/getProductPrices';
import type { StripeSubscription } from '@/types/subscription';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

type EditSubscriptionCardProps = {
  subscription: StripeSubscription;
  vehicleInfo?: VehicleDetail;
  productName: string;
  vehicleDisplay: string;
  productPrices: ProductPrice[];
};

export const EditSubscriptionCard: React.FC<EditSubscriptionCardProps> = ({
  subscription,
  vehicleInfo: _vehicleInfo,
  productName,
  vehicleDisplay,
  productPrices,
}) => {
  const t = useTranslations('Subscriptions.interval');
  const router = useRouter();

  const currentPriceId = subscription?.items?.data?.[0]?.price?.id;
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);

  // Sort productPrices so current subscription is always first
  const sortedProductPrices = [...productPrices].sort((a, b) => {
    if (a.id === currentPriceId) {
      return -1;
    }
    if (b.id === currentPriceId) {
      return 1;
    }
    return 0;
  });

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
      isCurrent: price.id === currentPriceId,
    };
  };

  const handlePriceSelect = (priceId: string) => {
    setSelectedPriceId(priceId);
  };

  const handleContinue = () => {
    if (selectedPriceId && selectedPriceId !== currentPriceId) {
      const url = new URL(window.location.href);
      url.searchParams.set('step', 'confirm');
      url.searchParams.set('priceId', selectedPriceId);
      router.push(url.toString());
    }
  };

  const hasValidSelection = selectedPriceId && selectedPriceId !== currentPriceId;

  return (
    <div className="p-4 bg-surface-raised rounded-2xl flex flex-col justify-between">
      <h1 className="text-2xl font-bold mb-4">Edit Subscription</h1>
      <div className="min-w-full bg-surface-default rounded-xl p-4">
        <p className="text-base leading-6 mb-6">
          Select your renewal plan for
          {' '}
          {productName}
          {' '}
          connected to
          {' '}
          {vehicleDisplay}
          .
        </p>

        <div className="space-y-3 mb-6">
          {sortedProductPrices.map((price) => {
            const { displayText, priceFormatted, isCurrent } = formatPrice(price);
            const isSelected = price.id === selectedPriceId;

            return (
              <button
                key={price.id}
                type="button"
                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:bg-gray-800 w-full text-left ${
                  isCurrent
                    ? 'border-white bg-gray-800'
                    : isSelected
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => handlePriceSelect(price.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePriceSelect(price.id);
                  }
                }}
              >
                {isCurrent && (
                  <div
                    className="absolute -top-2 right-6 px-2 py-1 rounded-full text-xs font-medium text-black bg-pill-gradient"
                  >
                    Current
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-base">{displayText}</div>
                    <div className="text-sm text-gray-400">{priceFormatted}</div>
                  </div>
                  <div className="text-lg font-bold">
                    {priceFormatted}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleContinue}
          className={`w-full py-3 px-4 rounded-full font-medium transition-colors ${
            hasValidSelection
              ? 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700'
              : 'bg-gray-400 text-gray-600 cursor-not-allowed'
          }`}
          type="button"
          disabled={!hasValidSelection}
        >
          Continue to Review
        </button>
      </div>
    </div>
  );
};

export default EditSubscriptionCard;
