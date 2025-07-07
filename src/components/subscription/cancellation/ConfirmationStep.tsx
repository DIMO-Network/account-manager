'use client';

import type { VehicleDetail } from '@/app/actions/getDimoVehicleDetails';
import type { StripeSubscription } from '@/types/subscription';
import { useTranslations } from 'next-intl';
import React from 'react';
import { getSubscriptionRenewalInfo } from '@/utils/subscriptionHelpers';

type ConfirmationStepProps = {
  subscription: StripeSubscription;
  vehicleInfo?: VehicleDetail;
  onProceedAction: () => void;
  onGoBackAction: () => void;
};

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  subscription,
  vehicleInfo,
  onProceedAction,
  onGoBackAction,
}) => {
  const t = useTranslations('Subscriptions.interval');
  const metadata = subscription?.metadata || {};
  const vehicleTokenId = metadata.vehicleTokenId || 'N/A';

  const { displayText: renewsOn } = getSubscriptionRenewalInfo(subscription);

  let type = 'N/A';
  if (subscription?.items?.data?.[0]?.price?.recurring?.interval === 'month') {
    type = t('monthly');
  } else if (subscription?.items?.data?.[0]?.price?.recurring?.interval === 'year') {
    type = t('annually');
  }

  const priceCents = subscription?.items?.data?.[0]?.price?.unit_amount;
  let priceFormatted = '';
  if (typeof priceCents === 'number') {
    priceFormatted = ` ($${(priceCents / 100).toFixed(2)})`;
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Are you sure?</h2>
        <p className="text-sm text-gray-400 mb-4">
          This action will cancel your subscription. You'll continue to have access until the end of your current billing period.
        </p>
      </div>

      <div className="mb-6">
        <h3 className="font-medium text-base mb-3">Subscription Details</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium">Connected To:</span>
            <div className="text-gray-400">
              {vehicleInfo
                ? (
                    <>
                      <div>{vehicleInfo.definition?.year && vehicleInfo.definition?.make && vehicleInfo.definition?.model ? `${vehicleInfo.definition.year} ${vehicleInfo.definition.make} ${vehicleInfo.definition.model}` : 'N/A'}</div>
                      <div className="text-xs">{vehicleInfo.dcn?.name || vehicleInfo.name || 'N/A'}</div>
                    </>
                  )
                : (
                    vehicleTokenId
                  )}
            </div>
          </div>
          <div>
            <span className="font-medium">Type:</span>
            <span className="text-gray-400 ml-2">
              {type}
              {priceFormatted}
            </span>
          </div>
          <div>
            <span className="font-medium">Renews on:</span>
            <span className="text-gray-400 ml-2">{renewsOn}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onGoBackAction}
          className="flex-1 py-2 px-4 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors"
          type="button"
        >
          Go Back
        </button>
        <button
          onClick={onProceedAction}
          className="flex-1 py-2 px-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
          type="button"
        >
          Proceed with cancellation
        </button>
      </div>
    </>
  );
};
