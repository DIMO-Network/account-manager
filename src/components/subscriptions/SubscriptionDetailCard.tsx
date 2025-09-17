'use client';

import { CarIcon, EditIcon } from '@/components/Icons';
import { PageHeader } from '@/components/ui';
import { getSubscriptionTypeAndPrice } from '@/libs/StripeSubscriptionService';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';
import { useRouter } from 'next/navigation';
import React from 'react';
import type { VehicleDetail } from '@/app/actions/getDimoVehicleDetails';
import type { StripeSubscription } from '@/types/subscription';
import type Stripe from 'stripe';
import { getStripeStatusDisplay, getStripeSubscriptionRenewalInfo } from './utils/subscriptionDisplayHelpers';

type SubscriptionDetailCardProps = {
  subscription: StripeSubscription;
  vehicleInfo?: VehicleDetail;
  nextScheduledPrice?: Stripe.Price | null;
  nextScheduledDate?: number | null;
};

export const SubscriptionDetailCard: React.FC<SubscriptionDetailCardProps> = ({ subscription, vehicleInfo, nextScheduledPrice, nextScheduledDate }) => {
  const router = useRouter();
  const metadata = subscription?.metadata || {};
  const vehicleTokenId = metadata.vehicleTokenId || 'N/A';
  const hasSerial = !!vehicleInfo?.aftermarketDevice?.serial;
  const hasVehicleToken = vehicleTokenId !== 'N/A';

  // Check if this is an S1 connection
  const isS1Connection = metadata.connectionType === 'S1';

  const serialNumber = hasSerial
    ? `${vehicleInfo?.aftermarketDevice?.serial || 'N/A'}`
    : hasVehicleToken
      ? `${vehicleTokenId}`
      : 'N/A';

  const serialLabel = hasSerial ? 'Serial Number' : hasVehicleToken ? 'Vehicle Token ID' : 'Serial Number';

  const isMarkedForCancellation = subscription.cancel_at_period_end || !!subscription.cancel_at;
  const isCanceled = subscription.status === 'canceled';
  const shouldDisableCancel = isMarkedForCancellation || isCanceled;

  const renewalInfo = getStripeSubscriptionRenewalInfo(subscription, nextScheduledPrice, nextScheduledDate);

  // Reusable styles
  const labelStyle = 'font-light text-xs leading-5 px-4 mb-1';
  const valueStyle = 'font-medium text-base leading-5 px-4 pb-4';
  const borderStyle = 'border-b border-gray-700';
  const clickableValueStyle = 'font-medium text-base leading-5 flex justify-between items-center cursor-pointer px-4';

  return (
    <>
      <PageHeader icon={<CarIcon />} title="Subscription Detail" className="mb-4" />
      <div className="flex flex-col justify-between bg-surface-default rounded-2xl py-3">
        <div className="space-y-4">
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

          {/* Serial Number / Vehicle Token ID */}
          <div>
            <div className={labelStyle}>{serialLabel}</div>
            <div className={`${valueStyle} ${borderStyle}`}>{serialNumber}</div>
          </div>

          {/* Type */}
          <div>
            <div className={labelStyle}>Type</div>
            {isS1Connection
              ? (
                  <div className={`${valueStyle} ${borderStyle}`}>
                    {getSubscriptionTypeAndPrice(subscription, nextScheduledPrice).type}
                  </div>
                )
              : (
                  <button
                    className={`${clickableValueStyle} ${borderStyle} w-full text-left pb-4`}
                    onClick={() => window.location.href = `/subscriptions/${subscription.id}/edit`}
                    type="button"
                  >
                    {getSubscriptionTypeAndPrice(subscription, nextScheduledPrice).displayText}
                    <EditIcon className="w-4 h-4 text-gray-400" />
                  </button>
                )}
          </div>

          {/* Schedule */}
          <div>
            <div className={labelStyle}>Schedule</div>
            <div className={`${valueStyle} ${borderStyle}`}>
              {isS1Connection
                ? (
                    <div>
                      {renewalInfo.date ? `Renews ${renewalInfo.date}` : 'Renews annually'}
                    </div>
                  )
                : (
                    <>
                      <div>{renewalInfo.displayText}</div>
                      {renewalInfo.secondaryText && (
                        <div className="text-xs text-text-secondary mt-1">
                          {renewalInfo.secondaryText}
                        </div>
                      )}
                    </>
                  )}
            </div>
          </div>

          {/* Status */}
          <div>
            <div className={labelStyle}>Status</div>
            <div className={`${valueStyle} ${getStripeStatusDisplay(subscription).color} ${borderStyle}`}>
              {getStripeStatusDisplay(subscription).text}
            </div>
          </div>

          {/* S1 Note */}
          {isS1Connection && (
            <div>
              <div className={labelStyle}>Note</div>
              <div className={`${valueStyle}`}>
                <div className="text-text-secondary">
                  To manage your subscription, please reach out to Kaufmann.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col mt-4 px-4 gap-2">
          <button
            onClick={() => router.push('/dashboard')}
            className={`${RESPONSIVE.touch} ${COLORS.button.secondary} ${BORDER_RADIUS.full} font-medium w-full mt-2`}
            type="button"
          >
            Back to Dashboard
          </button>
          {!isS1Connection && (
            <button
              className={`${RESPONSIVE.touch} ${BORDER_RADIUS.full} font-medium w-full ${
                shouldDisableCancel
                  ? COLORS.button.disabledTransparent
                  : `${COLORS.button.tertiary}`
              }`}
              type="button"
              onClick={() => window.location.href = `/subscriptions/${subscription.id}/cancel`}
              disabled={shouldDisableCancel}
            >
              {shouldDisableCancel ? 'Subscription Canceled' : 'Cancel Subscription'}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default SubscriptionDetailCard;
