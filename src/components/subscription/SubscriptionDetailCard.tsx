'use client';

import type { VehicleDetail } from '@/app/actions/getDimoVehicleDetails';
import type { StripeSubscription } from '@/types/subscription';
import { useTranslations } from 'next-intl';
import React from 'react';
import { getSubscriptionRenewalInfo } from '@/utils/subscriptionHelpers';

type SubscriptionDetailCardProps = {
  subscription: StripeSubscription;
  vehicleInfo?: VehicleDetail;
};

export const SubscriptionDetailCard: React.FC<SubscriptionDetailCardProps> = ({ subscription, vehicleInfo }) => {
  const t = useTranslations('Subscriptions.interval');
  const metadata = subscription?.metadata || {};
  const connectionId = metadata.connectionId || 'N/A';
  const vehicleTokenId = metadata.vehicleTokenId || 'N/A';

  const { date } = getSubscriptionRenewalInfo(subscription);

  const isMarkedForCancellation = subscription.cancel_at_period_end && subscription.cancel_at;
  const labelText = isMarkedForCancellation ? 'Cancels on' : 'Renews on';

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
    <div className="p-4 bg-surface-raised rounded-2xl flex flex-col justify-between">
      <h1 className="text-2xl font-bold mb-4">Subscription Detail</h1>
      <div className="min-w-full bg-surface-default rounded-xl p-4">
        <table className="w-full">
          <tbody>
            {/* Connection Id */}
            <tr>
              <td className="font-medium text-base leading-5 pb-2">Connection Id</td>
            </tr>
            <tr>
              <td className="font-light text-xs leading-5 break-all pb-3 border-b border-gray-700">{connectionId}</td>
            </tr>
            {/* Connected To */}
            <tr>
              <td className="font-medium text-base leading-5 pt-4 pb-2">Connected To</td>
            </tr>
            <tr>
              <td className="font-light text-xs leading-5 pb-1">
                {vehicleInfo
                  ? (
                      <>
                        <div>{vehicleInfo.definition?.year && vehicleInfo.definition?.make && vehicleInfo.definition?.model ? `${vehicleInfo.definition.year} ${vehicleInfo.definition.make} ${vehicleInfo.definition.model}` : 'N/A'}</div>
                        <div className="text-xs text-gray-400">{vehicleInfo.dcn?.name || vehicleInfo.name || 'N/A'}</div>
                      </>
                    )
                  : (
                      vehicleTokenId
                    )}
              </td>
            </tr>
            <tr>
              <td className="font-light text-xs leading-5 pb-3 border-b border-gray-700"></td>
            </tr>
            {/* Type */}
            <tr>
              <td className="font-medium text-base leading-5 pt-4 pb-2">Type</td>
            </tr>
            <tr>
              <td className="font-light text-xs leading-5 pb-3 border-b border-gray-700">
                {type}
                {priceFormatted}
              </td>
            </tr>
            {/* Renews or Cancels on */}
            <tr>
              <td className="font-medium text-base leading-5 pt-4 pb-2">{labelText}</td>
            </tr>
            <tr>
              <td className="font-light text-xs leading-5 pb-3 border-b border-gray-700">{date}</td>
            </tr>
          </tbody>
        </table>
        <button
          className={`mt-6 py-2 px-4 rounded-full transition-colors w-full ${
            isMarkedForCancellation
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-white text-black hover:bg-gray-100'
          }`}
          type="button"
          onClick={() => window.location.href = `/subscriptions/${subscription.id}/cancel`}
          disabled={!!isMarkedForCancellation}
        >
          Cancel Subscription
        </button>
      </div>
    </div>
  );
};

export default SubscriptionDetailCard;
