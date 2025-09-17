'use client';

import { getCancellationFeedbackLabel } from '@/libs/StripeSubscriptionService';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';
import React from 'react';
import type { StripeCancellationFeedback } from '@/libs/StripeSubscriptionService';
import type { StripeSubscription } from '@/types/subscription';
import { getStripeSubscriptionRenewalInfo } from '../utils/subscriptionDisplayHelpers';

type ReviewStepProps = {
  subscription: StripeSubscription;
  selectedReason: StripeCancellationFeedback;
  customComment?: string;
  onKeepSubscriptionAction: () => void;
  onCancelSubscriptionAction: () => void;
  canceling: boolean;
};

export const ReviewStep: React.FC<ReviewStepProps> = ({
  subscription,
  selectedReason,
  customComment,
  onKeepSubscriptionAction,
  onCancelSubscriptionAction,
  canceling,
}) => {
  const { date } = getStripeSubscriptionRenewalInfo(subscription);

  const getReasonLabel = (reason: StripeCancellationFeedback) => {
    return getCancellationFeedbackLabel(reason);
  };

  return (
    <>
      <div className="mb-6">
        <h3 className="font-medium text-base leading-6">Confirm cancellation</h3>
        <p className="text-sm text-gray-400 mt-1">
          Your subscription will expire on
          {' '}
          {date ?? 'N/A'}
          .
        </p>
      </div>

      <div className="bg-surface-raised rounded-xl mb-4 py-4">
        <div className="px-4">
          <h3 className="font-medium text-base leading-6">Cancellation Reason</h3>
          <p className="text-sm mt-1">
            {selectedReason === 'other' ? customComment : getReasonLabel(selectedReason)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onKeepSubscriptionAction}
          className={`${RESPONSIVE.touch} ${COLORS.button.secondary} ${BORDER_RADIUS.full} font-medium w-full`}
          disabled={canceling}
          type="button"
        >
          Keep subscription
        </button>
        <button
          onClick={onCancelSubscriptionAction}
          className={`${RESPONSIVE.touch} ${BORDER_RADIUS.full} font-medium w-full ${
            canceling
              ? COLORS.button.disabledTransparentRed
              : COLORS.button.tertiaryRed
          }`}
          disabled={canceling}
          type="button"
        >
          {canceling ? 'Canceling...' : 'Confirm'}
        </button>
      </div>
    </>
  );
};
