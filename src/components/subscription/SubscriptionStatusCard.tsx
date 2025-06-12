'use client';

type SubscriptionStatusCardProps = {
  hasActiveSubscription: boolean;
  subscription?: any;
  isBusy: boolean;
  busyState?: 'loading' | 'activating' | 'canceling';
  onRefreshAction: () => void;
  onCancelAction?: () => void;
  compact?: boolean;
};

export const SubscriptionStatusCard = ({
  hasActiveSubscription,
  subscription,
  isBusy,
  busyState = 'loading',
  onRefreshAction,
  onCancelAction,
  compact = false,
}: SubscriptionStatusCardProps) => {
  const cardClasses = compact
    ? 'flex items-center justify-between p-2 border rounded text-xs'
    : 'p-3 border rounded';

  if (hasActiveSubscription) {
    return (
      <div className={`${cardClasses} bg-green-50 border-green-200`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-green-800 font-medium">
              Active
              {subscription?.planType && ` (${subscription.planType})`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshAction}
              className={`${compact ? 'text-xs' : 'text-sm'} text-blue-600 hover:text-blue-800`}
              type="button"
              title="Refresh status"
              disabled={isBusy}
            >
              ↻
            </button>
            {onCancelAction && (
              <button
                onClick={onCancelAction}
                disabled={isBusy}
                className={`${compact ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1'} text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-300 rounded transition-colors disabled:opacity-50`}
                type="button"
                title="Cancel subscription"
              >
                {busyState === 'canceling' ? 'Canceling...' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isBusy) {
    const messages = {
      loading: 'Checking status...',
      activating: 'Activating subscription...',
      canceling: 'Canceling subscription...',
    };

    const descriptions = {
      loading: 'Please wait while we check your subscription.',
      activating: 'Payment successful! This usually takes a few seconds...',
      canceling: 'Please wait while we process the cancellation.',
    };

    return (
      <div className={`${cardClasses} bg-blue-50 border-blue-200`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent mr-2"></div>
            <div>
              <span className="text-blue-800 font-medium">{messages[busyState]}</span>
              {!compact && (
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-blue-700 mt-1`}>
                  {descriptions[busyState]}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onRefreshAction}
            className={`${compact ? 'text-xs' : 'text-sm'} text-blue-600 hover:text-blue-800`}
            type="button"
            title="Check now"
          >
            ↻
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${cardClasses} bg-yellow-50 border-yellow-200`}>
      <div className="flex items-center">
        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
        <span className="text-yellow-800 font-medium">No Active Subscription</span>
      </div>
    </div>
  );
};
