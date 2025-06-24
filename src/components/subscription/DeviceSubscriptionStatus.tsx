'use client';

import { useCallback, useEffect, useState } from 'react';
import { ActivateButton } from '@/components/subscription/ActivateButton';
import { CancellationFlow } from '@/components/subscription/CancellationFlow';
import { ErrorDisplay } from '@/components/subscription/ErrorDisplay';
import { StatusHeader } from '@/components/subscription/StatusHeader';
import { SubscriptionStatusCard } from '@/components/subscription/SubscriptionStatusCard';
import { SuccessMessage } from '@/components/subscription/SuccessMessage';
import { useCancellationSuccess } from '@/hooks/useCancellationSuccess';
import { useCheckoutSuccess } from '@/hooks/useCheckoutSuccess';
import { useSubscriptionActions } from '@/hooks/useSubscriptionActions';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

type SubscriptionStatusProps = {
  connectionId: string;
  vehicleTokenId: number;
  userEmail?: string;
  compact?: boolean;
};

export const DeviceSubscriptionStatus = ({
  connectionId,
  vehicleTokenId,
  compact = false,
}: SubscriptionStatusProps) => {
  const { subscriptionData, loading, error, checkStatus } = useSubscriptionStatus(connectionId);
  const { activating, canceling, error: actionError, activateSubscription, cancelSubscription } = useSubscriptionActions();

  const { showSuccessState, connectionIdFromCheckout, clearSuccessState } = useCheckoutSuccess();
  const { showCancellationSuccess, canceledConnectionId, initiateCancellation, clearCancellationSuccess } = useCancellationSuccess();

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (subscriptionData?.hasActiveSubscription) {
      if (showSuccessState && connectionIdFromCheckout === connectionId) {
        clearSuccessState();
      }
      if (showCancellationSuccess && canceledConnectionId === connectionId) {
        clearCancellationSuccess();
      }
    }
  }, [
    subscriptionData?.hasActiveSubscription,
    showSuccessState,
    connectionIdFromCheckout,
    connectionId,
    clearSuccessState,
    showCancellationSuccess,
    canceledConnectionId,
    clearCancellationSuccess,
  ]);

  const handleRefresh = useCallback(() => {
    checkStatus();
  }, [checkStatus]);

  const handleActivate = useCallback((plan: 'monthly' | 'annual' = 'monthly') => {
    activateSubscription(connectionId, vehicleTokenId, plan);
  }, [activateSubscription, connectionId, vehicleTokenId]);

  const handleCancelClick = useCallback(() => {
    setShowCancelConfirm(true);
  }, []);

  const handleCancelConfirm = useCallback(async () => {
    if (subscriptionData?.subscription?.id) {
      initiateCancellation(connectionId);
      await cancelSubscription(subscriptionData.subscription.id);
      setShowCancelConfirm(false);
      setTimeout(() => {
        checkStatus();
      }, 1000);
    }
  }, [cancelSubscription, subscriptionData?.subscription?.id, checkStatus, connectionId, initiateCancellation]);

  const handleCancelCancel = useCallback(() => {
    setShowCancelConfirm(false);
  }, []);

  if (loading && !subscriptionData) {
    return (
      <div className={compact ? 'text-xs text-gray-500' : 'p-4 border rounded-lg'}>
        {!compact && <StatusHeader connectionId={connectionId} compact={compact} />}
        <p>Checking subscription status...</p>
      </div>
    );
  }

  const isBusy = loading || activating || canceling;
  const busyState = activating ? 'activating' : canceling ? 'canceling' : 'loading';
  const displayError = error || actionError;
  const hasActiveSubscription = subscriptionData?.hasActiveSubscription || false;

  const shouldShowOptimisticSuccess = showSuccessState
    && connectionIdFromCheckout === connectionId
    && !hasActiveSubscription;

  const shouldShowCancellationSuccess = showCancellationSuccess
    && canceledConnectionId === connectionId
    && !hasActiveSubscription
    && !canceling;

  const containerClasses = compact ? 'space-y-2' : 'p-4 border rounded-lg';

  return (
    <div className={containerClasses}>
      <StatusHeader connectionId={connectionId} compact={compact} />

      <ErrorDisplay error={displayError} compact={compact} />

      <div className="space-y-3">
        <CancellationFlow
          showConfirm={showCancelConfirm}
          showSuccess={shouldShowCancellationSuccess}
          canceling={canceling}
          onConfirmAction={handleCancelConfirm}
          onCancelAction={handleCancelCancel}
          onClearSuccessAction={clearCancellationSuccess}
          compact={compact}
        />

        {!showCancelConfirm && !shouldShowCancellationSuccess && (
          <>
            {shouldShowOptimisticSuccess
              ? (
                  <SuccessMessage
                    show={true}
                    onClearAction={clearSuccessState}
                    onRefreshAction={handleRefresh}
                    compact={compact}
                  />
                )
              : (
                  <SubscriptionStatusCard
                    hasActiveSubscription={hasActiveSubscription}
                    subscription={subscriptionData?.subscription}
                    isBusy={isBusy}
                    busyState={busyState}
                    onRefreshAction={handleRefresh}
                    onCancelAction={hasActiveSubscription ? handleCancelClick : undefined}
                    compact={compact}
                  />
                )}
          </>
        )}

        {!hasActiveSubscription && !shouldShowOptimisticSuccess && !isBusy && !showCancelConfirm && (
          <div className={compact ? '' : 'p-3 bg-yellow-50 border border-yellow-200 rounded'}>
            <div className="flex items-center justify-between">
              {!compact && (
                <p className="text-sm text-yellow-700 mt-1">
                  Activate a subscription to unlock premium features for your R1 device.
                </p>
              )}
              <ActivateButton
                onActivateAction={handleActivate}
                activating={activating}
                compact={compact}
              />
            </div>
          </div>
        )}

        {subscriptionData?.error && (
          <ErrorDisplay error={subscriptionData.error} compact={compact} />
        )}
      </div>
    </div>
  );
};
