'use client';

import type { StripeEnhancedSubscription } from '@/libs/StripeSubscriptionService';
import type { BackendSubscription } from '@/types/subscription';
import { useEffect, useRef, useState } from 'react';
import { useStripeCustomer } from '@/hooks/useStripeCustomer';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';
import { SubscriptionsClient } from '../subscriptions/SubscriptionsClient';

function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-900 rounded ${className}`} />
  );
}

type DashboardContentProps = {
  initialSubscriptions: StripeEnhancedSubscription[];
  initialBackendStatuses: BackendSubscription[];
};

export function DashboardContent({
  initialSubscriptions,
  initialBackendStatuses,
}: DashboardContentProps) {
  const { customerId, loading: customerLoading, error } = useStripeCustomer();
  const [subscriptions, setSubscriptions] = useState<StripeEnhancedSubscription[]>(initialSubscriptions);
  const [fetchingSubscriptions, setFetchingSubscriptions] = useState(false);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      // Only fetch if we have a customerId, no initial subscriptions, and not already fetching
      if (customerId && initialSubscriptions.length === 0 && !isFetchingRef.current) {
        try {
          isFetchingRef.current = true;
          setFetchingSubscriptions(true);
          const response = await fetch(`/api/stripe/subscriptions?customerId=${customerId}`);

          if (!response.ok) {
            throw new Error('Failed to fetch subscriptions');
          }

          const data = await response.json();
          setSubscriptions(data.subscriptions);
        } catch (error) {
          console.error('Error fetching subscriptions:', error);
        } finally {
          setFetchingSubscriptions(false);
          isFetchingRef.current = false;
        }
      }
    };

    fetchSubscriptions();
  }, [customerId, initialSubscriptions.length]);

  const isLoading = customerLoading || (fetchingSubscriptions && subscriptions.length === 0);

  if (isLoading) {
    return (
      <div className="w-full lg:w-3/4 order-2 lg:order-1">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <SkeletonBox className="w-6 h-6" />
              <SkeletonBox className="w-48 h-6" />
            </div>
          </div>

          {/* Subscription Cards Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`${BORDER_RADIUS.lg} ${COLORS.background.primary} p-4`}>
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 space-y-3">
                    <SkeletonBox className="w-3/4 h-6" />
                    <SkeletonBox className="w-1/2 h-4" />
                    <div className="flex gap-2">
                      <SkeletonBox className="w-16 h-6" />
                      <SkeletonBox className="w-20 h-6" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 lg:w-1/4">
                    <SkeletonBox className="w-full h-10" />
                    <SkeletonBox className="w-full h-8" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Unable to load subscriptions</p>
      </div>
    );
  }

  return (
    <SubscriptionsClient
      subscriptions={subscriptions}
      backendStatuses={initialBackendStatuses}
    />
  );
}
