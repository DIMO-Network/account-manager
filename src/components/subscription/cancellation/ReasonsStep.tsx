'use client';

import React, { useState } from 'react';

const CANCELLATION_REASONS = [
  'Too expensive',
  'Not using the service',
  'Found a better alternative',
  'Technical issues',
  'Customer service issues',
  'Other',
];

type ReasonsStepProps = {
  onContinueAction: (reason: string, customReason?: string) => void;
  onGoBackAction: () => void;
};

export const ReasonsStep: React.FC<ReasonsStepProps> = ({
  onContinueAction,
  onGoBackAction,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  const handleContinue = () => {
    if (!selectedReason) {
      return;
    }
    onContinueAction(selectedReason, customReason);
  };

  const isContinueDisabled = !selectedReason || (selectedReason === 'Other' && !customReason.trim());

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
          <label key={reason} className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="cancellationReason"
              value={reason}
              checked={selectedReason === reason}
              onChange={e => setSelectedReason(e.target.value)}
              className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-red-500"
            />
            <span className="text-sm">{reason}</span>
          </label>
        ))}

        {selectedReason === 'Other' && (
          <div className="mt-3">
            <textarea
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              placeholder="Please tell us more..."
              className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none"
              rows={3}
            />
          </div>
        )}
      </div>

      <div className="flex gap-3">
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
