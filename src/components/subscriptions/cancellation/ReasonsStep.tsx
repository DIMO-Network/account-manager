'use client';

import type { StripeCancellationFeedback } from '@/libs/StripeSubscriptionService';
import React, { useState } from 'react';
import { STRIPE_CANCELLATION_FEEDBACK } from '@/libs/StripeSubscriptionService';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';

const CANCELLATION_REASONS = [
  { value: 'customer_service' as StripeCancellationFeedback, label: STRIPE_CANCELLATION_FEEDBACK.customer_service },
  { value: 'low_quality' as StripeCancellationFeedback, label: STRIPE_CANCELLATION_FEEDBACK.low_quality },
  { value: 'missing_features' as StripeCancellationFeedback, label: STRIPE_CANCELLATION_FEEDBACK.missing_features },
  { value: 'switched_service' as StripeCancellationFeedback, label: STRIPE_CANCELLATION_FEEDBACK.switched_service },
  { value: 'too_complex' as StripeCancellationFeedback, label: STRIPE_CANCELLATION_FEEDBACK.too_complex },
  { value: 'too_expensive' as StripeCancellationFeedback, label: STRIPE_CANCELLATION_FEEDBACK.too_expensive },
  { value: 'unused' as StripeCancellationFeedback, label: STRIPE_CANCELLATION_FEEDBACK.unused },
  { value: 'other' as StripeCancellationFeedback, label: STRIPE_CANCELLATION_FEEDBACK.other },
];

type ReasonsStepProps = {
  onContinueAction: (feedback: StripeCancellationFeedback, comment?: string) => void;
  onGoBackAction: () => void;
};

export const ReasonsStep: React.FC<ReasonsStepProps> = ({
  onContinueAction,
  onGoBackAction,
}) => {
  const [selectedReason, setSelectedReason] = useState<StripeCancellationFeedback | ''>('');
  const [customComment, setCustomComment] = useState<string>('');

  const handleContinue = () => {
    if (!selectedReason) {
      return;
    }
    onContinueAction(selectedReason, customComment);
  };

  const isContinueDisabled = !selectedReason || (selectedReason === 'other' && !customComment.trim());

  return (
    <>
      <div className="mb-6">
        <h3 className="font-medium text-base leading-6">Why are you cancelling?</h3>
        <p className="text-sm text-gray-400 mt-1">
          Your feedback helps us improve our service. Please let us know why you're cancelling.
        </p>
      </div>

      <div className="bg-surface-raised rounded-xl mb-4 py-4">
        <div className="space-y-3 px-4">
          {CANCELLATION_REASONS.map(reason => (
            <label key={reason.value} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="cancellationReason"
                value={reason.value}
                checked={selectedReason === reason.value}
                onChange={e => setSelectedReason(e.target.value as StripeCancellationFeedback)}
                className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-red-500"
              />
              <span className="text-sm">{reason.label}</span>
            </label>
          ))}

          {selectedReason === 'other' && (
            <div className="mt-3">
              <textarea
                name="customComment"
                value={customComment}
                onChange={e => setCustomComment(e.target.value)}
                placeholder="Please tell us more..."
                className="w-full p-3 rounded-lg text-sm resize-none bg-surface-input text-text-secondary"
                rows={3}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onGoBackAction}
          className={`${RESPONSIVE.touch} ${COLORS.button.secondary} ${BORDER_RADIUS.full} font-medium w-full`}
          type="button"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className={`${RESPONSIVE.touch} ${BORDER_RADIUS.full} font-medium w-full ${
            isContinueDisabled
              ? `${COLORS.button.disabledTransparent}`
              : COLORS.button.tertiary
          }`}
          disabled={isContinueDisabled}
          type="button"
        >
          Continue
        </button>
      </div>
    </>
  );
};
