'use client';

import type { StripeCancellationFeedback } from '@/utils/subscriptionHelpers';
import React, { useState } from 'react';
import { STRIPE_CANCELLATION_FEEDBACK } from '@/utils/subscriptionHelpers';

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
        <h2 className="text-lg font-semibold mb-2">Why are you cancelling?</h2>
        <p className="text-sm text-gray-400 mb-4">
          Your feedback helps us improve our service. Please let us know why you're cancelling.
        </p>
      </div>

      <div className="mb-6 space-y-3">
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
              value={customComment}
              onChange={e => setCustomComment(e.target.value)}
              placeholder="Please tell us more..."
              className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none"
              rows={3}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onGoBackAction}
          className="flex-1 py-2 px-4 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors"
          type="button"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className="flex-1 py-2 px-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          disabled={isContinueDisabled}
          type="button"
        >
          Continue
        </button>
      </div>
    </>
  );
};
