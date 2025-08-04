'use client';

import type { BackendSubscription } from '@/types/subscription';
import type { StripeEnhancedSubscription } from '@/utils/subscriptionHelpers';
import { useEffect, useState } from 'react';
import { useStripeCustomer } from '@/hooks/useStripeCustomer';
import { fetchEnhancedSubscriptions } from '@/utils/subscriptionHelpers';
import { SubscriptionsClient } from '../subscriptions/SubscriptionsClient';

type DashboardContentProps = {
  initialSubscriptions: StripeEnhancedSubscription[];
  initialBackendStatuses: BackendSubscription[];
};

export function DashboardContent({
  initialSubscriptions,
  initialBackendStatuses,
}: DashboardContentProps) {
  const { customerId, loading, error } = useStripeCustomer();
  const [subscriptions, setSubscriptions] = useState<StripeEnhancedSubscription[]>(initialSubscriptions);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (customerId && initialSubscriptions.length === 0) {
        try {
          const enhancedSubscriptions = await fetchEnhancedSubscriptions(customerId);
          setSubscriptions(enhancedSubscriptions);
        } catch (error) {
          console.error('Error fetching subscriptions:', error);
        }
      }
    };

    fetchSubscriptions();
  }, [customerId, initialSubscriptions.length]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading subscriptions...</p>
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
