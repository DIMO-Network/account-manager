'use client';

type SubscriptionStatusCardProps = {
  hasActiveSubscription: boolean;
  subscription?: any;
  isPolling: boolean;
  onRefreshAction: () => void;
  compact?: boolean;
};

export const SubscriptionStatusCard = ({
  hasActiveSubscription,
  subscription,
  isPolling,
  onRefreshAction,
  compact = false,
}: SubscriptionStatusCardProps) => {
  const cardClasses = compact
    ? 'flex items-center justify-between p-2 border rounded text-xs'
    : 'p-3 border rounded';

  if (hasActiveSubscription) {
    return (
      <div className={`${cardClasses} bg-green-50 border-green-200`}>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span className="text-green-800 font-medium">
            Active
            {subscription?.planType && ` (${subscription.planType})`}
          </span>
        </div>
        <button
          onClick={onRefreshAction}
          className={`${compact ? 'text-xs' : 'text-sm'} text-blue-600 hover:text-blue-800`}
          type="button"
          title="Refresh status"
        >
          ↻
        </button>
      </div>
    );
  }

  if (isPolling) {
    return (
      <div className={`${cardClasses} bg-blue-50 border-blue-200`}>
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent mr-2"></div>
          <div>
            <span className="text-blue-800 font-medium">Activating subscription...</span>
            {!compact && (
              <p className={`${compact ? 'text-xs' : 'text-sm'} text-blue-700 mt-1`}>
                Payment successful! This usually takes 10-30 seconds...
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
