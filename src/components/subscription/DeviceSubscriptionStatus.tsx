'use client';

import { useCallback } from 'react';
import { ActivateButton } from '@/components/subscription/ActivateButton';
import { SubscriptionStatusCard } from '@/components/subscription/SubscriptionStatusCard';
import { useCheckoutPolling } from '@/hooks/useCheckoutPolling';
import { useSubscriptionActions } from '@/hooks/useSubscriptionActions';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

type SubscriptionStatusProps = {
  serialNumber: string;
  userEmail?: string;
  compact?: boolean;
};

export const DeviceSubscriptionStatus = ({
  serialNumber,
  userEmail,
  compact = false,
}: SubscriptionStatusProps) => {
  const { subscriptionData, loading, error, checkStatus } = useSubscriptionStatus(serialNumber);
  const { activating, error: activationError, activateSubscription } = useSubscriptionActions();

  const { isPolling } = useCheckoutPolling({
    serialNumber,
    subscriptionData,
    checkStatus,
  });

  const handleRefresh = useCallback(() => {
    checkStatus(true);
  }, [checkStatus]);

  const handleActivate = useCallback(() => {
    activateSubscription(serialNumber, userEmail);
  }, [activateSubscription, serialNumber, userEmail]);

  if (loading) {
    return (
      <div className={compact ? 'text-xs text-gray-500' : 'p-4 border rounded-lg'}>
        {!compact && <h3 className="text-lg font-semibold">Device Subscription</h3>}
        <p>Checking subscription status...</p>
      </div>
    );
  }

  const displayError = error || activationError;
  const isActivating = activating || isPolling;
  const hasActiveSubscription = subscriptionData?.hasActiveSubscription || false;

  if (compact) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-900">Subscription Status</h4>

        {displayError && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
            <span className="text-red-800">
              Error:
              {' '}
              {displayError}
            </span>
          </div>
        )}

        <SubscriptionStatusCard
          hasActiveSubscription={hasActiveSubscription}
          subscription={subscriptionData?.subscription}
          isPolling={isActivating}
          onRefreshAction={handleRefresh}
          compact={true}
        />

        {!hasActiveSubscription && !isActivating && (
          <ActivateButton
            onActivateAction={handleActivate}
            activating={isActivating}
            compact={true}
          />
        )}

        {subscriptionData?.error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
            <span className="text-red-800">
              Error:
              {' '}
              {subscriptionData.error}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Full-size version
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Device Subscription</h3>

      {displayError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded mb-4">
          <span className="text-red-800">
            Error:
            {' '}
            {displayError}
          </span>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <span className="font-medium">Serial Number:</span>
          {' '}
          {serialNumber}
        </div>

        <SubscriptionStatusCard
          hasActiveSubscription={hasActiveSubscription}
          subscription={subscriptionData?.subscription}
          isPolling={isActivating}
          onRefreshAction={handleRefresh}
          compact={true}
        />

        {!hasActiveSubscription && !isActivating && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 mt-1">
                  Activate a subscription to unlock premium features for your R1 device.
                </p>
              </div>
              <ActivateButton
                onActivateAction={handleActivate}
                activating={isActivating}
                compact={true}
              />
            </div>
          </div>
        )}

        {subscriptionData?.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <span className="text-red-800">
              Error:
              {' '}
              {subscriptionData.error}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
