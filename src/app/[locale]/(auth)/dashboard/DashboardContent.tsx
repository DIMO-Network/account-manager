'use client';

import type { StripeEnhancedSubscription } from '@/libs/StripeSubscriptionService';
import type { BackendSubscription } from '@/types/subscription';
import { useEffect, useState } from 'react';
import { useStripeCustomer } from '@/hooks/useStripeCustomer';
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
          const response = await fetch(`/api/stripe/subscriptions?customerId=${customerId}`);

          if (!response.ok) {
            throw new Error('Failed to fetch subscriptions');
          }

          const data = await response.json();
          setSubscriptions(data.subscriptions);
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
