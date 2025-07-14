'use client';

import type { AllSubscriptionStatusesResponse } from '@/types/subscription';
import type { EnhancedSubscription } from '@/utils/subscriptionHelpers';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CarIcon, ChevronRightIcon, ConnectionIcon } from '@/components/Icons';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';
import { featureFlags } from '@/utils/FeatureFlags';
import { getSubscriptionRenewalInfo, getSubscriptionTypeAndPrice } from '@/utils/subscriptionHelpers';

type SubscriptionsClientProps = {
  subscriptions: EnhancedSubscription[];
};

export function SubscriptionsClient({ subscriptions }: SubscriptionsClientProps) {
  const [backendStatuses, setBackendStatuses] = useState<AllSubscriptionStatusesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useBackendData, setUseBackendData] = useState(false);

  // Fetch backend data if useBackendProxy is enabled
  useEffect(() => {
    if (featureFlags.useBackendProxy) {
      const fetchBackendData = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await fetch('/api/subscriptions/status/all');

          if (response.status === 401) {
            // Authentication failed - fallback to Stripe data
            console.warn('Backend authentication failed, falling back to Stripe data');
            setUseBackendData(false);
            return;
          }

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data: AllSubscriptionStatusesResponse = await response.json();
          console.warn('Backend subscription data:', data);
          console.warn('Number of subscriptions received:', data.length);
          setBackendStatuses(data);
          setUseBackendData(true);
        } catch (err) {
          console.error('Error fetching backend subscription statuses:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
          setUseBackendData(false);
        } finally {
          setLoading(false);
        }
      };

      fetchBackendData();
    }
  }, []);

  // Helper functions for backend data
  const formatDate = (dateString: string | null) => {
    if (!dateString) {
      return 'N/A';
    }
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusDisplay = (status: any) => {
    const isActive = status.status === 'active' || status.status === 'trialing';
    const isTrialing = status.status === 'trialing';
    const isIncomplete = status.new_status === 'trialing_incomplete';

    let statusText = status.new_status;
    let statusColor = 'text-gray-500';

    if (isActive) {
      statusColor = 'text-green-500';
      if (isTrialing) {
        statusText = 'Trial Active';
      } else {
        statusText = 'Active';
      }
    } else if (isIncomplete) {
      statusColor = 'text-yellow-500';
      statusText = 'Trial Incomplete';
    } else if (status.status === 'canceled') {
      statusColor = 'text-red-500';
      statusText = 'Canceled';
    }

    return { text: statusText, color: statusColor };
  };

  const getRenewalInfo = (status: any) => {
    if (status.cancel_at) {
      return `Cancels on ${formatDate(status.cancel_at)}`;
    }
    if (status.next_renewal_date) {
      return `Renews on ${formatDate(status.next_renewal_date)}`;
    }
    if (status.trial_end) {
      return `Trial ends on ${formatDate(status.trial_end)}`;
    }
    return 'N/A';
  };

  let content;

  // Use backend data if available and useBackendProxy is enabled
  if (featureFlags.useBackendProxy && useBackendData && backendStatuses) {
    if (backendStatuses.length === 0) {
      content = <p>No devices found.</p>;
    } else {
      content = (
        <ul className="space-y-4">
          {backendStatuses.map((status, index) => {
            const device = status.device;
            const statusDisplay = getStatusDisplay(status);
            const key = device?.tokenId ? `device-${device.tokenId}` : `status-${status.start_date}-${index}`;

            return (
              <li key={key} className={`py-3 px-4 gap-2 ${BORDER_RADIUS.xl} bg-surface-raised hover:bg-dark-950 transition`}>
                <div className="block">
                  <div className="flex flex-row items-center justify-between gap-2 mb-2 border-b border-gray-700 pb-2">
                    <div className="flex flex-row items-center gap-2">
                      <ConnectionIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
                      <h3 className="text-base font-medium leading-6">
                        {device ? `${device.vehicle.definition.make} ${device.vehicle.definition.model}` : 'Unknown Device'}
                      </h3>
                    </div>
                    <div className={`text-sm font-medium ${statusDisplay.color}`}>
                      {statusDisplay.text}
                    </div>
                  </div>
                  {device && (
                    <div className="text-base font-medium leading-5 mb-2 mt-4">
                      {device.vehicle.definition.year}
                      {' '}
                      {device.vehicle.definition.make}
                      {' '}
                      {device.vehicle.definition.model}
                    </div>
                  )}
                  <div className="text-xs font-light leading-5 mt-2">
                    {device?.serial ? `Serial: ${device.serial}` : 'No serial number'}
                  </div>
                  <div className={`text-xs font-light leading-5 ${COLORS.text.secondary}`}>
                    {getRenewalInfo(status)}
                  </div>
                  {device?.connection && (
                    <div className="text-xs font-light leading-5 mt-1 text-blue-400">
                      Connected via
                      {' '}
                      {device.connection.name}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      );
    }
  } else {
    // Use existing Stripe data
    if (!subscriptions || subscriptions.length === 0) {
      content = <p>No subscriptions found.</p>;
    } else {
      content = (
        <ul className="space-y-4">
          {subscriptions.map(sub => (
            <li key={sub.id} className={`py-3 px-4 gap-2 ${BORDER_RADIUS.xl} bg-surface-raised hover:bg-dark-950 transition`}>
              <Link href={`/subscriptions/${sub.id}`} className="block">
                <div className="flex flex-row items-center justify-between gap-2 mb-2 border-b border-gray-700 pb-2">
                  <div className="flex flex-row items-center gap-2">
                    <ConnectionIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
                    <h3 className="text-base font-medium leading-6">
                      {sub.productName}
                    </h3>
                  </div>
                  <ChevronRightIcon className={`w-2 h-3 ${COLORS.text.secondary}`} />
                </div>
                <div className="text-base font-medium leading-5 mb-2 mt-4">
                  {sub.vehicleDisplay}
                </div>
                <div className="text-xs font-light leading-5 mt-2">
                  {getSubscriptionTypeAndPrice(sub).displayText}
                </div>
                <div className={`text-xs font-light leading-5 ${COLORS.text.secondary}`}>
                  {getSubscriptionRenewalInfo(sub, sub.nextScheduledPrice, sub.nextScheduledDate).displayText}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      );
    }
  }

  if (loading) {
    content = <p>Loading subscription statuses...</p>;
  }

  if (error) {
    content = (
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <div className="text-sm text-red-500">
          Error:
          {error}
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-row items-center gap-2 border-b border-gray-700 pb-2">
        <CarIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
        <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Subscriptions</h1>
      </div>
      {content}
    </div>
  );
}

export default SubscriptionsClient;
