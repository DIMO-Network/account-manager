'use client';

import { COLORS, RESPONSIVE, SPACING } from '@/utils/designSystem';

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
    ? `flex items-center justify-between ${SPACING.xs} border rounded text-xs`
    : `${SPACING.sm} border rounded`;

  if (hasActiveSubscription) {
    return (
      <div className={`${cardClasses} ${COLORS.background.secondary} border ${COLORS.feedback.success}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-feedback-success rounded-full mr-2"></div>
            <span className="text-feedback-success font-medium">
              Active
              {subscription?.planType && ` (${subscription.planType})`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshAction}
              className={`${RESPONSIVE.touch} ${compact ? 'text-xs' : 'text-sm'} text-primary-500 hover:text-primary-600 transition-colors`}
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
                className={`
                  ${RESPONSIVE.touch}
                  ${compact ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1'}
                  text-feedback-error hover:text-feedback-error hover:bg-surface-sunken
                  border border-feedback-error rounded transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
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
      <div className={`${cardClasses} ${COLORS.background.secondary} border border-primary-500`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-3 w-3 border border-primary-500 border-t-transparent mr-2"></div>
            <div>
              <span className="text-primary-500 font-medium">{messages[busyState]}</span>
              {!compact && (
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-grey-400 mt-1`}>
                  {descriptions[busyState]}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onRefreshAction}
            className={`${RESPONSIVE.touch} ${compact ? 'text-xs' : 'text-sm'} text-primary-500 hover:text-primary-600 transition-colors`}
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
    <div className={`${cardClasses} ${COLORS.background.secondary} border border-yellow-500`}>
      <div className="flex items-center">
        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
        <span className="text-yellow-500 font-medium">No Active Subscription</span>
      </div>
    </div>
  );
};
