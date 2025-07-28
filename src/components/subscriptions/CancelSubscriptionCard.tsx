'use client';

import type { VehicleDetail } from '@/app/actions/getDimoVehicleDetails';
import type { StripeSubscription } from '@/types/subscription';
import type { StripeCancellationFeedback } from '@/utils/subscriptionHelpers';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import { CarIcon } from '@/components/Icons';

import { COLORS, SPACING } from '@/utils/designSystem';
import { featureFlags } from '@/utils/FeatureFlags';
import {
  ConfirmationStep,
  ReasonsStep,
  ReviewStep,
} from './cancellation';

type CancellationReason = StripeCancellationFeedback;

type CancelSubscriptionCardProps = {
  subscription: StripeSubscription;
  vehicleInfo?: VehicleDetail;
  nextScheduledPrice?: any;
  nextScheduledDate?: number | null;
};

export const CancelSubscriptionCard: React.FC<CancelSubscriptionCardProps> = ({
  subscription,
  vehicleInfo,
  nextScheduledPrice,
  nextScheduledDate,
}) => {
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedReason, setSelectedReason] = useState<CancellationReason | ''>('');
  const [customComment, setCustomComment] = useState<string>('');
  const step = searchParams.get('step') || 'confirm';

  const handleProceedToReasons = () => {
    router.push(`/subscriptions/${subscription.id}/cancel?step=reasons`);
  };

  const handleGoBack = () => {
    if (step === 'reasons') {
      router.push(`/subscriptions/${subscription.id}/cancel`);
    } else if (step === 'review') {
      router.push(`/subscriptions/${subscription.id}/cancel?step=reasons`);
    } else {
      router.push(`/subscriptions/${subscription.id}`);
    }
  };

  const handleContinueToReview = (feedback: CancellationReason, comment?: string) => {
    setSelectedReason(feedback);
    setCustomComment(comment || '');
    router.push(`/subscriptions/${subscription.id}/cancel?step=review`);
  };

  const handleKeepSubscription = () => {
    router.push(`/subscriptions/${subscription.id}`);
  };

  const handleFinalCancel = async () => {
    const cancellationDetails = {
      feedback: selectedReason as CancellationReason,
      comment: customComment || undefined,
    };

    setCanceling(true);
    setError(null);

    // Use the new unified cancellation endpoint
    const endpoint = featureFlags.useBackendProxy
      ? '/api/subscriptions/cancel-subscription'
      : '/api/subscriptions/cancel';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          cancellationDetails,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        router.push(`/subscriptions/${subscription.id}`);
      } else {
        console.error('Failed to cancel subscription:', result.error);
        setError(result.error || 'Failed to cancel subscription');
        setCanceling(false);
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setError('Failed to cancel subscription');
      setCanceling(false);
    }
  };

  const renderCurrentStep = () => {
    switch (step) {
      case 'reasons':
        return (
          <ReasonsStep
            onContinueAction={handleContinueToReview}
            onGoBackAction={handleGoBack}
          />
        );
      case 'review':
        return (
          <ReviewStep
            subscription={subscription}
            selectedReason={selectedReason as CancellationReason}
            customComment={customComment}
            onKeepSubscriptionAction={handleKeepSubscription}
            onCancelSubscriptionAction={handleFinalCancel}
            canceling={canceling}
          />
        );
      default:
        return (
          <ConfirmationStep
            subscription={subscription}
            vehicleInfo={vehicleInfo}
            onProceedAction={handleProceedToReasons}
            onGoBackAction={handleGoBack}
            nextScheduledPrice={nextScheduledPrice}
            nextScheduledDate={nextScheduledDate}
          />
        );
    }
  };

  return (
    <>
      <div className="flex flex-row items-center gap-2 border-b border-gray-700 pb-2 mb-4">
        <CarIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
        <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Cancel Subscription</h1>
      </div>
      <div className="flex flex-col justify-between min-w-full bg-surface-default rounded-xl py-4 px-3">
        {error && (
          <div className={`${SPACING.sm} mb-4 ${COLORS.background.secondary} border border-feedback-error rounded-lg`}>
            <p className="text-feedback-error text-sm">{error}</p>
          </div>
        )}

        {renderCurrentStep()}
      </div>
    </>
  );
};

export default CancelSubscriptionCard;
