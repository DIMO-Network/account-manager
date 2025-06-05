'use client';

import { useCallback, useEffect } from 'react';
import { ActivateButton } from '@/components/subscription/ActivateButton';
import { SubscriptionStatusCard } from '@/components/subscription/SubscriptionStatusCard';
import { useCheckoutSuccess } from '@/hooks/useCheckoutSuccess';
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
  const { showSuccessState, serialFromCheckout, clearSuccessState } = useCheckoutSuccess();

  useEffect(() => {
    if (subscriptionData?.hasActiveSubscription && showSuccessState && serialFromCheckout === serialNumber) {
      clearSuccessState();
    }
  }, [subscriptionData?.hasActiveSubscription, showSuccessState, serialFromCheckout, serialNumber, clearSuccessState]);

  const handleRefresh = useCallback(() => {
    checkStatus(true);
  }, [checkStatus]);

  const handleActivate = useCallback(() => {
    activateSubscription(serialNumber, userEmail);
  }, [activateSubscription, serialNumber, userEmail]);

  const shouldShowOptimisticSuccess = showSuccessState
    && serialFromCheckout === serialNumber
    && !subscriptionData?.hasActiveSubscription;

  if (loading) {
    return (
      <div className={compact ? 'text-xs text-gray-500' : 'p-4 border rounded-lg'}>
        {!compact && <h3 className="text-lg font-semibold">Device Subscription</h3>}
        <p>Checking subscription status...</p>
      </div>
    );
  }

  const displayError = error || activationError;
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

        {shouldShowOptimisticSuccess
          ? (
              <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-green-800 font-medium">
                      ✅ Subscription Activated!
                    </span>
                  </div>
                  <button
                    onClick={handleRefresh}
                    className="text-green-600 hover:text-green-800 text-xs"
                    type="button"
                    title="Refresh to confirm"
                  >
                    ↻
                  </button>
                </div>
                <p className="text-green-700 mt-1">
                  Your R1 device subscription is now active.
                </p>
              </div>
            )
          : (
              <SubscriptionStatusCard
                hasActiveSubscription={hasActiveSubscription}
                subscription={subscriptionData?.subscription}
                isPolling={activating}
                onRefreshAction={handleRefresh}
                compact={true}
              />
            )}

        {!hasActiveSubscription && !shouldShowOptimisticSuccess && !activating && (
          <ActivateButton
            onActivateAction={handleActivate}
            activating={activating}
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

        {shouldShowOptimisticSuccess
          ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <span className="text-green-800 font-medium text-lg">
                        ✅ Subscription Activated Successfully!
                      </span>
                      <p className="text-green-700 text-sm mt-1">
                        Your R1 device subscription is now active and ready to use.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRefresh}
                    className="text-green-600 hover:text-green-800 text-sm"
                    type="button"
                    title="Refresh to confirm"
                  >
                    ↻ Refresh
                  </button>
                </div>
              </div>
            )
          : (
              <SubscriptionStatusCard
                hasActiveSubscription={hasActiveSubscription}
                subscription={subscriptionData?.subscription}
                isPolling={activating}
                onRefreshAction={handleRefresh}
                compact={true}
              />
            )}

        {!hasActiveSubscription && !shouldShowOptimisticSuccess && !activating && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 mt-1">
                  Activate a subscription to unlock premium features for your R1 device.
                </p>
              </div>
              <ActivateButton
                onActivateAction={handleActivate}
                activating={activating}
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
