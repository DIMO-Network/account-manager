'use client';

import type { VehicleDetail } from '@/app/actions/getDimoVehicleDetails';
import type { StripeSubscription, StripeSubscriptionSchedule } from '@/types/subscription';
import type { StripeCancellationFeedback } from '@/utils/subscriptionHelpers';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import { CarIcon } from '@/components/Icons';
import { useSubscriptionActions } from '@/hooks/useSubscriptionActions';
import { COLORS } from '@/utils/designSystem';
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
  const { cancelSubscription, releaseSubscriptionSchedule, canceling, cancelingSchedule, error } = useSubscriptionActions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedReason, setSelectedReason] = useState<CancellationReason | ''>('');
  const [customComment, setCustomComment] = useState<string>('');

  const step = searchParams.get('step') || 'confirm';

  // Helper function to determine if subscription has a schedule
  const hasSchedule = (): boolean => {
    const schedule = subscription.schedule as StripeSubscriptionSchedule | null;
    return !!(schedule && schedule.id && (schedule.status === 'not_started' || schedule.status === 'active'));
  };

  // Helper function to get schedule ID
  const getScheduleId = (): string | null => {
    const schedule = subscription.schedule as StripeSubscriptionSchedule | null;
    return schedule?.id || null;
  };

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

    // Check if this is a scheduled subscription
    if (hasSchedule()) {
      const scheduleId = getScheduleId();
      if (scheduleId) {
        // Release the subscription schedule
        const result = await releaseSubscriptionSchedule(scheduleId, {
          preserve_cancel_date: true,
        });
        if (result.success) {
          router.push('/subscriptions');
        }
        return;
      }
    }

    // Fall back to regular subscription cancellation
    const result = await cancelSubscription(subscription.id, cancellationDetails);
    if (result.success) {
      router.push('/subscriptions');
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
            canceling={canceling || cancelingSchedule}
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
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {renderCurrentStep()}
      </div>
    </>
  );
};

export default CancelSubscriptionCard;
