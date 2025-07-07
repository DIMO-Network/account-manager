'use client';

import type { StripeSubscription } from '@/types/subscription';
import React from 'react';
import { getSubscriptionRenewalInfo } from '@/utils/subscriptionHelpers';

// Stripe's official cancellation feedback enum values
const CANCELLATION_REASONS = [
  { value: 'too_expensive', label: 'It\'s too expensive' },
  { value: 'unused', label: 'I don\'t use the service enough' },
  { value: 'switched_service', label: 'I\'m switching to a different service' },
  { value: 'missing_features', label: 'Some features are missing' },
  { value: 'low_quality', label: 'Quality was less than expected' },
  { value: 'customer_service', label: 'Customer service was less than expected' },
  { value: 'too_complex', label: 'Ease of use was less than expected' },
  { value: 'other', label: 'Other reason' },
] as const;

type CancellationReason = typeof CANCELLATION_REASONS[number]['value'];

type ReviewStepProps = {
  subscription: StripeSubscription;
  selectedReason: CancellationReason;
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
  const { date } = getSubscriptionRenewalInfo(subscription);

  const getReasonLabel = (reason: CancellationReason) => {
    const reasonObj = CANCELLATION_REASONS.find(r => r.value === reason);
    return reasonObj?.label || reason;
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Confirm cancellation</h2>
        <p className="text-sm text-gray-400 mb-4">
          Your subscription will expire on
          {' '}
          {date ?? 'N/A'}
          .
        </p>
      </div>

      <div className="mb-6 p-4 bg-surface-sunken rounded-lg">
        <h3 className="font-medium text-sm mb-2">Cancellation Reason: </h3>
        <p className="text-sm">
          {selectedReason === 'other' ? customComment : getReasonLabel(selectedReason)}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onKeepSubscriptionAction}
          className="flex-1 py-2 px-4 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors"
          disabled={canceling}
          type="button"
        >
          Keep subscription
        </button>
        <button
          onClick={onCancelSubscriptionAction}
          className="flex-1 py-2 px-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          disabled={canceling}
          type="button"
        >
          {canceling ? 'Canceling...' : 'Confirm cancellation'}
        </button>
      </div>
    </>
  );
};
