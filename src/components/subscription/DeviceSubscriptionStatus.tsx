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
  const { showCancellationSuccess, canceledSerial, initiateCancellation, clearCancellationSuccess } = useCancellationSuccess();

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (subscriptionData?.hasActiveSubscription) {
      if (showSuccessState && serialFromCheckout === serialNumber) {
        clearSuccessState();
      }
      if (showCancellationSuccess && canceledSerial === serialNumber) {
        clearCancellationSuccess();
      }
    }
  }, [
    subscriptionData?.hasActiveSubscription,
    showSuccessState,
    serialFromCheckout,
    serialNumber,
    clearSuccessState,
    showCancellationSuccess,
    canceledSerial,
    clearCancellationSuccess,
  ]);

  const handleRefresh = useCallback(() => {
    checkStatus();
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
      setTimeout(() => {
        checkStatus();
      }, 1000);
    }
  }, [cancelSubscription, subscriptionData?.subscription?.id, checkStatus, serialNumber, initiateCancellation]);

  const handleCancelCancel = useCallback(() => {
    setShowCancelConfirm(false);
  }, []);

  if (loading && !subscriptionData) {
    return (
      <div className={compact ? 'text-xs text-gray-500' : 'p-4 border rounded-lg'}>
        {!compact && <StatusHeader serialNumber={serialNumber} compact={compact} />}
        <p>Checking subscription status...</p>
      </div>
    );
  }

  const isBusy = loading || activating || canceling;
  const busyState = activating ? 'activating' : canceling ? 'canceling' : 'loading';
  const displayError = error || actionError;
  const hasActiveSubscription = subscriptionData?.hasActiveSubscription || false;

  const shouldShowOptimisticSuccess = showSuccessState
    && serialFromCheckout === serialNumber
    && !hasActiveSubscription;

  const shouldShowCancellationSuccess = showCancellationSuccess
    && canceledSerial === serialNumber
    && !hasActiveSubscription
    && !canceling;

  const containerClasses = compact ? 'space-y-2' : 'p-4 border rounded-lg';

  return (
    <div className={containerClasses}>
      <StatusHeader serialNumber={serialNumber} compact={compact} />

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
