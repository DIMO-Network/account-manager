'use client';

import { getSubscriptionTypeAndPrice } from '@/libs/StripeSubscriptionService';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';
import React from 'react';
import type { VehicleDetail } from '@/app/actions/getDimoVehicleDetails';
import type { StripeSubscription } from '@/types/subscription';
import { getStripeSubscriptionRenewalInfo } from '../utils/subscriptionDisplayHelpers';

type ConfirmationStepProps = {
  subscription: StripeSubscription;
  vehicleInfo?: VehicleDetail;
  nextScheduledPrice?: any;
  nextScheduledDate?: number | null;
  onProceedAction: () => void;
  onGoBackAction: () => void;
};

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  subscription,
  vehicleInfo,
  nextScheduledPrice,
  nextScheduledDate,
  onProceedAction,
  onGoBackAction,
}) => {
  const metadata = subscription?.metadata || {};
  const vehicleTokenId = metadata.vehicleTokenId || 'N/A';

  const renewalInfo = getStripeSubscriptionRenewalInfo(subscription, nextScheduledPrice, nextScheduledDate);

  const labelStyle = 'font-medium text-base leading-5 px-4 mb-1';
  const valueStyle = 'font-light text-xs leading-5 px-4 pb-3';
  const borderStyle = 'border-b border-gray-700';

  return (
    <>
      <div className="mb-6">
        <h3 className="font-medium text-base leading-6">Are you sure?</h3>
        <p className="text-sm text-gray-400 mt-1">
          This action will cancel your subscription. You'll continue to have access until the end of your current billing period.
        </p>
      </div>

      <div className="bg-surface-raised rounded-xl mb-4 pt-4 pb-1">
        <div className="space-y-4">
          {/* Connected To */}
          <div>
            <div className={labelStyle}>Connected To</div>
            <div className={`${valueStyle} ${borderStyle}`}>
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
            </div>
          </div>

          {/* Type */}
          <div>
            <div className={labelStyle}>Type</div>
            <div className={`${valueStyle} ${borderStyle}`}>
              {getSubscriptionTypeAndPrice(subscription, nextScheduledPrice).displayText}
            </div>
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
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onGoBackAction}
          className={`${RESPONSIVE.touch} ${COLORS.button.secondary} ${BORDER_RADIUS.full} font-medium w-full`}
          type="button"
        >
          Go Back
        </button>
        <button
          onClick={onProceedAction}
          className={`${RESPONSIVE.touch} ${COLORS.button.tertiary} ${BORDER_RADIUS.full} font-medium w-full`}
          type="button"
        >
          Proceed with cancellation
        </button>
      </div>
    </>
  );
};
