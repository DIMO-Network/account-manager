'use client';

import type { VehicleDetail } from '@/app/actions/getDimoVehicleDetails';
import type { StripeSubscription } from '@/types/subscription';
import { useRouter } from 'next/navigation';
import React from 'react';
import { CarIcon, EditIcon } from '@/components/Icons';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';
import { getSubscriptionTypeAndPrice } from '@/utils/subscriptionHelpers';
import { getStripeSubscriptionRenewalInfo } from './utils/subscriptionDisplayHelpers';

type SubscriptionDetailCardProps = {
  subscription: StripeSubscription;
  vehicleInfo?: VehicleDetail;
  nextScheduledPrice?: any;
  nextScheduledDate?: number | null;
};

export const SubscriptionDetailCard: React.FC<SubscriptionDetailCardProps> = ({ subscription, vehicleInfo, nextScheduledPrice, nextScheduledDate }) => {
  const router = useRouter();
  const metadata = subscription?.metadata || {};
  const connectionId = metadata.connectionId || 'N/A';
  const vehicleTokenId = metadata.vehicleTokenId || 'N/A';
  const serialNumber = vehicleInfo?.aftermarketDevice?.serial || connectionId;

  const isMarkedForCancellation = subscription.cancel_at_period_end && subscription.cancel_at;

  const renewalInfo = getStripeSubscriptionRenewalInfo(subscription, nextScheduledPrice, nextScheduledDate);

  // Reusable styles
  const labelStyle = 'font-medium text-base leading-5 px-4 mb-1';
  const valueStyle = 'font-light text-xs leading-5 px-4 pb-3';
  const borderStyle = 'border-b border-gray-700';
  const clickableValueStyle = 'font-light text-xs leading-5 flex justify-between items-center cursor-pointer px-4';

  return (
    <>
      <div className="flex flex-row items-center gap-2 border-b border-gray-700 pb-2 mb-4">
        <CarIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
        <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Subscription Detail</h1>
      </div>
      <div className="flex flex-col justify-between bg-surface-default rounded-2xl py-3">
        <div className="space-y-4">
          {/* Serial Number */}
          <div>
            <div className={labelStyle}>Serial Number</div>
            <div className={`${valueStyle} ${borderStyle}`}>{serialNumber}</div>
          </div>

          {/* Connected To */}
          <div>
            <div className={labelStyle}>Connected To</div>
            <div className={`${valueStyle} ${borderStyle}`}>
              {vehicleInfo
                ? (
                    <>
                      <div>
                        {vehicleInfo.definition?.year && vehicleInfo.definition?.make && vehicleInfo.definition?.model ? `${vehicleInfo.definition.year} ${vehicleInfo.definition.make} ${vehicleInfo.definition.model}` : 'N/A'}
                      </div>
                      <div className="text-xs text-text-secondary">{vehicleInfo.dcn?.name || vehicleInfo.name || 'N/A'}</div>
                    </>
                  )
                : (
                    vehicleTokenId
                  )}
            </div>
          </div>

          {/* Type */}
          <div>
            <div className={labelStyle}>Type</div>
            <button
              className={`${clickableValueStyle} ${borderStyle} w-full text-left pb-4`}
              onClick={() => window.location.href = `/subscriptions/${subscription.id}/edit`}
              type="button"
            >
              {getSubscriptionTypeAndPrice(subscription).displayText}
              <EditIcon className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Schedule */}
          <div>
            <div className={labelStyle}>Schedule</div>
            <div className={valueStyle}>
              <div>{renewalInfo.displayText}</div>
              {renewalInfo.secondaryText && (
                <div className="text-xs text-text-secondary">
                  {renewalInfo.secondaryText}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col mt-4 px-4 gap-2">
          <button
            onClick={() => router.push('/dashboard')}
            className={`${RESPONSIVE.touch} ${COLORS.button.secondary} ${BORDER_RADIUS.full} font-medium w-full mt-2`}
            type="button"
          >
            Back to Dashboard
          </button>
          <button
            className={`${RESPONSIVE.touch} ${BORDER_RADIUS.full} font-medium w-full ${
              isMarkedForCancellation
                ? COLORS.button.disabledTransparent
                : `${COLORS.button.tertiary}`
            }`}
            type="button"
            onClick={() => window.location.href = `/subscriptions/${subscription.id}/cancel`}
            disabled={!!isMarkedForCancellation}
          >
            {isMarkedForCancellation ? 'Subscription Canceled' : 'Cancel Subscription'}
          </button>
        </div>
      </div>
    </>
  );
};

export default SubscriptionDetailCard;
