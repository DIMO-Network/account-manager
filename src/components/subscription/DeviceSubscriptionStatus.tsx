'use client';

import { useCallback, useEffect, useState } from 'react';
import { ActivateButton } from '@/components/subscription/ActivateButton';
import { SubscriptionStatusCard } from '@/components/subscription/SubscriptionStatusCard';
import { useCancellationSuccess } from '@/hooks/useCancellationSuccess';
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
  const { activating, canceling, error: actionError, activateSubscription, cancelSubscription } = useSubscriptionActions();
  const { showSuccessState, serialFromCheckout, clearSuccessState } = useCheckoutSuccess();
  const {
    showCancellationSuccess,
    canceledSerial,
    initiateCancellation,
    clearCancellationSuccess,
  } = useCancellationSuccess();

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (subscriptionData?.hasActiveSubscription && showSuccessState && serialFromCheckout === serialNumber) {
      clearSuccessState();
    }
  }, [subscriptionData?.hasActiveSubscription, showSuccessState, serialFromCheckout, serialNumber, clearSuccessState]);

  // Clear cancellation success when subscription becomes active (user activated a new one)
  useEffect(() => {
    if (subscriptionData?.hasActiveSubscription && showCancellationSuccess && canceledSerial === serialNumber) {
      clearCancellationSuccess();
    }
  }, [subscriptionData?.hasActiveSubscription, showCancellationSuccess, canceledSerial, serialNumber, clearCancellationSuccess]);

  const handleRefresh = useCallback(() => {
    checkStatus(true);
  }, [checkStatus]);

  const handleActivate = useCallback(() => {
    activateSubscription(serialNumber, userEmail);
  }, [activateSubscription, serialNumber, userEmail]);

  const handleCancelClick = useCallback(() => {
    setShowCancelConfirm(true);
  }, []);

  const handleCancelConfirm = useCallback(async () => {
    if (subscriptionData?.subscription?.id) {
      initiateCancellation(serialNumber);
      await cancelSubscription(subscriptionData.subscription.id);
      setShowCancelConfirm(false);

      // Refresh status after a short delay to ensure Stripe has processed the cancellation
      setTimeout(() => {
        checkStatus(true);
      }, 1000);
    }
  }, [cancelSubscription, subscriptionData?.subscription?.id, checkStatus, serialNumber, initiateCancellation]);

  const handleCancelCancel = useCallback(() => {
    setShowCancelConfirm(false);
  }, []);

  const shouldShowOptimisticSuccess = showSuccessState
    && serialFromCheckout === serialNumber
    && !subscriptionData?.hasActiveSubscription;

  const shouldShowCancellationSuccess = showCancellationSuccess
    && canceledSerial === serialNumber
    && !subscriptionData?.hasActiveSubscription
    && !canceling;

  if (loading) {
    return (
      <div className={compact ? 'text-xs text-gray-500' : 'p-4 border rounded-lg'}>
        {!compact && <h3 className="text-lg font-semibold">Device Subscription</h3>}
        <p>Checking subscription status...</p>
      </div>
    );
  }

  const displayError = error || actionError;
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

        {showCancelConfirm && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800 text-xs font-medium mb-2">
              Cancel your subscription?
            </p>
            <p className="text-red-700 text-xs mb-3">
              This action cannot be undone. You'll lose access to premium features.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCancelConfirm}
                disabled={canceling}
                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                type="button"
              >
                {canceling ? 'Canceling...' : 'Yes, Cancel'}
              </button>
              <button
                onClick={handleCancelCancel}
                className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                type="button"
              >
                Keep Subscription
              </button>
            </div>
          </div>
        )}

        {shouldShowCancellationSuccess && (
          <div className="p-2 bg-orange-50 border border-orange-200 rounded text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                <span className="text-orange-800 font-medium">
                  ✅ Subscription Canceled
                </span>
              </div>
              <button
                onClick={clearCancellationSuccess}
                className="text-orange-600 hover:text-orange-800 text-xs"
                type="button"
                title="Clear message"
              >
                ✕
              </button>
            </div>
            <p className="text-orange-700 mt-1">
              Your subscription has been canceled successfully.
            </p>
          </div>
        )}

        {!showCancelConfirm && !shouldShowCancellationSuccess && (
          <>
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
                    onCancelAction={hasActiveSubscription ? handleCancelClick : undefined}
                    canceling={canceling}
                    compact={true}
                  />
                )}
          </>
        )}

        {!hasActiveSubscription && !shouldShowOptimisticSuccess && !activating && !showCancelConfirm && (
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

  // Full-size version follows the same pattern...
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

        {showCancelConfirm && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h4 className="text-red-800 font-medium mb-2">
              Cancel your subscription?
            </h4>
            <p className="text-red-700 text-sm mb-4">
              This action cannot be undone. You'll immediately lose access to premium features for your R1 device.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelConfirm}
                disabled={canceling}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                type="button"
              >
                {canceling ? 'Canceling...' : 'Yes, Cancel Subscription'}
              </button>
              <button
                onClick={handleCancelCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                type="button"
              >
                Keep Subscription
              </button>
            </div>
          </div>
        )}

        {shouldShowCancellationSuccess && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <div>
                  <span className="text-orange-800 font-medium text-lg">
                    ✅ Subscription Canceled Successfully
                  </span>
                  <p className="text-orange-700 text-sm mt-1">
                    Your subscription has been canceled. You can activate a new subscription anytime.
                  </p>
                </div>
              </div>
              <button
                onClick={clearCancellationSuccess}
                className="text-orange-600 hover:text-orange-800 text-sm"
                type="button"
                title="Clear message"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {!showCancelConfirm && !shouldShowCancellationSuccess && (
          <>
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
                    onCancelAction={hasActiveSubscription ? handleCancelClick : undefined}
                    canceling={canceling}
                    compact={false}
                  />
                )}
          </>
        )}

        {!hasActiveSubscription && !shouldShowOptimisticSuccess && !activating && !showCancelConfirm && (
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
