'use client';

import type { VehicleDetail } from '@/app/actions/getDimoVehicleDetails';
import type { StripeCancellationFeedback } from '@/libs/StripeSubscriptionService';
import type { StripeSubscription } from '@/types/subscription';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useTransition } from 'react';
import { CarIcon } from '@/components/Icons';
import { PageHeader } from '@/components/ui';
import { COLORS, SPACING } from '@/utils/designSystem';
import { featureFlags } from '@/utils/FeatureFlags';
import { ConfirmationStep } from './ConfirmationStep';
import { ConfirmationStepSkeleton } from './ConfirmationStepSkeleton';
import { ReasonsStep } from './ReasonsStep';
import { ReasonsStepSkeleton } from './ReasonsStepSkeleton';
import { ReviewStep } from './ReviewStep';
import { ReviewStepSkeleton } from './ReviewStepSkeleton';

type CancellationReason = StripeCancellationFeedback;

type CancellationFlowProps = {
  subscription: StripeSubscription;
  vehicleInfo?: VehicleDetail;
  nextScheduledPrice?: any;
  nextScheduledDate?: number | null;
};

export function CancellationFlow({
  subscription,
  vehicleInfo,
  nextScheduledPrice,
  nextScheduledDate,
}: CancellationFlowProps) {
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();

  const [selectedReason, setSelectedReason] = useState<CancellationReason | ''>('');
  const [customComment, setCustomComment] = useState<string>('');
  const step = searchParams.get('step') || 'confirm';

  const handleProceedToReasons = () => {
    startTransition(() => {
      router.push(`/subscriptions/${subscription.id}/cancel?step=reasons`);
    });
  };

  const handleGoBack = () => {
    startTransition(() => {
      if (step === 'reasons') {
        router.push(`/subscriptions/${subscription.id}/cancel`);
      } else if (step === 'review') {
        router.push(`/subscriptions/${subscription.id}/cancel?step=reasons`);
      } else {
        router.push(`/subscriptions/${subscription.id}`);
      }
    });
  };

  const handleContinueToReview = (feedback: CancellationReason, comment?: string) => {
    setSelectedReason(feedback);
    setCustomComment(comment || '');
    startTransition(() => {
      router.push(`/subscriptions/${subscription.id}/cancel?step=review`);
    });
  };

  const handleKeepSubscription = () => {
    startTransition(() => {
      router.push(`/subscriptions/${subscription.id}`);
    });
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

  // Show loading skeleton during transitions
  if (isPending) {
    return (
      <>
        <PageHeader icon={<CarIcon />} title="Cancel Subscription" className="mb-4" />
        <div className="flex flex-col justify-between min-w-full bg-surface-default rounded-xl py-4 px-3">
          {step === 'reasons'
            ? (
                <ReasonsStepSkeleton />
              )
            : step === 'review'
              ? (
                  <ReviewStepSkeleton />
                )
              : (
                  <ConfirmationStepSkeleton />
                )}
        </div>
      </>
    );
  }

  // Render appropriate step
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
      <PageHeader icon={<CarIcon />} title="Cancel Subscription" className="mb-4" />
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
}
