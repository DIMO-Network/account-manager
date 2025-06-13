'use client';

type CancellationFlowProps = {
  showConfirm: boolean;
  showSuccess: boolean;
  canceling: boolean;
  onConfirmAction: () => void;
  onCancelAction: () => void;
  onClearSuccessAction: () => void;
  compact?: boolean;
};

export const CancellationFlow = ({
  showConfirm,
  showSuccess,
  canceling,
  onConfirmAction,
  onCancelAction,
  onClearSuccessAction,
  compact = false,
}: CancellationFlowProps) => {
  if (showSuccess) {
    const baseClasses = compact
      ? 'p-2 bg-orange-50 border border-orange-200 rounded text-xs'
      : 'p-4 bg-orange-50 border border-orange-200 rounded';

    return (
      <div className={baseClasses}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`${compact ? 'w-2 h-2' : 'w-3 h-3'} bg-orange-500 rounded-full mr-${compact ? '2' : '3'}`}></div>
            <div>
              <span className={`text-orange-800 font-medium ${compact ? 'text-xs' : 'text-lg'}`}>
                ✅ Subscription Canceled
                {compact ? '' : ' Successfully'}
              </span>
              {!compact && (
                <p className="text-orange-700 text-sm mt-1">
                  Your subscription has been canceled. You can activate a new subscription anytime.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClearSuccessAction}
            className={`text-orange-600 hover:text-orange-800 ${compact ? 'text-xs' : 'text-sm'}`}
            type="button"
            title="Clear message"
          >
            ✕
          </button>
        </div>
        {compact && (
          <p className="text-orange-700 mt-1">Your subscription has been canceled successfully.</p>
        )}
      </div>
    );
  }

  if (showConfirm) {
    const baseClasses = compact
      ? 'p-3 bg-red-50 border border-red-200 rounded'
      : 'p-4 bg-red-50 border border-red-200 rounded';

    return (
      <div className={baseClasses}>
        <p className={`text-red-800 font-medium mb-2 ${compact ? 'text-xs' : ''}`}>
          Cancel your subscription?
        </p>
        <p className={`text-red-700 mb-3 ${compact ? 'text-xs' : 'text-sm'}`}>
          This action cannot be undone. You'll
          {' '}
          {compact ? 'lose access to premium features' : 'immediately lose access to premium features for your R1 device'}
          .
        </p>
        <div className="flex gap-2">
          <button
            onClick={onConfirmAction}
            disabled={canceling}
            className={`${compact ? 'px-2 py-1 text-xs' : 'px-4 py-2'} bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors`}
            type="button"
          >
            {canceling ? 'Canceling...' : `Yes, Cancel${compact ? '' : ' Subscription'}`}
          </button>
          <button
            onClick={onCancelAction}
            className={`${compact ? 'px-2 py-1 text-xs' : 'px-4 py-2'} bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors`}
            type="button"
          >
            Keep Subscription
          </button>
        </div>
      </div>
    );
  }

  return null;
};
