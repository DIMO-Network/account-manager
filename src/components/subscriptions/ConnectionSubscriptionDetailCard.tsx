'use client';

import type { BackendSubscription } from '@/types/subscription';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { CarIcon } from '@/components/Icons';
import { PageHeader } from '@/components/ui';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';
import { getBackendSubscriptionRenewalInfo } from './utils/subscriptionDisplayHelpers';

type ConnectionSubscriptionDetailCardProps = {
  subscription: BackendSubscription;
};

export const ConnectionSubscriptionDetailCard: React.FC<ConnectionSubscriptionDetailCardProps> = ({ subscription }) => {
  const router = useRouter();
  const [isActivating, setIsActivating] = useState(false);
  const device = subscription.device;

  if (!device) {
    return null;
  }

  const vehicleTokenId = device.vehicle?.tokenId;
  const connectionName = device.connection?.name || 'Unknown Connection';
  const isCanceled = subscription.status === 'canceled';

  const renewalInfo = getBackendSubscriptionRenewalInfo(subscription, device);

  // Get manufacturer display name
  const getManufacturerDisplayName = (manufacturerName: string) => {
    switch (manufacturerName) {
      case 'Ruptela':
        return 'R1';
      case 'AutoPi':
        return 'AutoPi';
      case 'HashDog':
        return 'Macaron';
      default:
        return manufacturerName;
    }
  };

  const handleActivateSubscription = async () => {
    setIsActivating(true);
    try {
      // Check if user has a valid payment method
      const checkResponse = await fetch('/api/subscriptions/check-user-payment-method', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!checkResponse.ok) {
        throw new Error('Failed to check payment method');
      }

      const { hasValidPaymentMethod } = await checkResponse.json();

      if (hasValidPaymentMethod) {
        // For users with valid payment methods, route to edit page for plan selection
        if (vehicleTokenId) {
          router.push(`/subscriptions/connection/${vehicleTokenId}/edit`);
        }
        return;
      }

      // Create subscription link for users without payment method
      if (!vehicleTokenId) {
        throw new Error('No vehicle token ID found');
      }

      const subscriptionResponse = await fetch(`/api/subscriptions/vehicle/${vehicleTokenId}/new-subscription-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!subscriptionResponse.ok) {
        throw new Error('Failed to create subscription link');
      }

      const { checkout_url } = await subscriptionResponse.json();

      window.location.href = checkout_url;
    } catch (error) {
      console.error('Error activating subscription:', error);
    }
  };

  // Reusable styles
  const labelStyle = 'font-light text-xs leading-5 px-4 mb-1';
  const valueStyle = 'font-medium text-base leading-5 px-4 pb-3';
  const borderStyle = 'border-b border-gray-700';

  return (
    <>
      <PageHeader
        icon={<CarIcon />}
        title={isCanceled ? 'Connection Details' : `${connectionName} Connection Details`}
        className="mb-4"
      />
      <div className="flex flex-col justify-between bg-surface-default rounded-2xl py-3">
        <div className="space-y-4">
          {/* Connected To - Always show first */}
          <div>
            <div className={labelStyle}>Connected To</div>
            <div className={`${valueStyle} ${borderStyle}`}>
              {device.vehicle
                ? (
                    <>
                      <div>
                        {device.vehicle.definition?.year && device.vehicle.definition?.make && device.vehicle.definition?.model
                          ? `${device.vehicle.definition.year} ${device.vehicle.definition.make} ${device.vehicle.definition.model}`
                          : 'N/A'}
                      </div>
                      <div className="text-xs text-text-secondary">
                        Vehicle Token ID:
                        {' '}
                        {device.vehicle.tokenId}
                      </div>
                    </>
                  )
                : (
                    'No vehicle connected'
                  )}
            </div>
          </div>

          {/* Serial Number - Show for canceled subscriptions */}
          {isCanceled && device.serial && (
            <div>
              <div className={labelStyle}>Serial Number</div>
              <div className={`${valueStyle} ${borderStyle}`}>
                {device.serial}
              </div>
            </div>
          )}

          {/* Connection Type - Show for canceled subscriptions */}
          {isCanceled && (device.manufacturer?.name || device.connection?.name) && (
            <div>
              <div className={labelStyle}>Connection Type</div>
              <div className={`${valueStyle} ${borderStyle}`}>
                {device.manufacturer?.name
                  ? getManufacturerDisplayName(device.manufacturer.name)
                  : device.connection?.name}
              </div>
            </div>
          )}

          {/* Date Information - Show for canceled subscriptions */}
          {isCanceled && (subscription.ended_at || subscription.trial_end) && (
            <div>
              <div className={labelStyle}>
                {subscription.ended_at ? 'Last Connected' : 'Trial Ended'}
              </div>
              <div className={`${valueStyle} ${borderStyle}`}>
                {new Date((subscription.ended_at || subscription.trial_end)!).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          )}

          {/* Connection Type - Only show for non-canceled subscriptions */}
          {!isCanceled && (
            <div>
              <div className={labelStyle}>Connection Type</div>
              <div className={`${valueStyle} ${borderStyle}`}>
                {connectionName}
              </div>
            </div>
          )}

          {/* Connection Date - Only show for non-canceled subscriptions */}
          {!isCanceled && (
            <div>
              <div className={labelStyle}>Connection Date</div>
              <div className={`${valueStyle} ${borderStyle}`}>
                {device.connection?.mintedAt
                  ? new Date(device.connection.mintedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </div>
            </div>
          )}

          {/* Schedule - Only show for non-canceled subscriptions */}
          {!isCanceled && (
            <div>
              <div className={labelStyle}>Schedule</div>
              <div className={valueStyle}>
                <div>{renewalInfo.displayText}</div>
                {renewalInfo.secondaryText && (
                  <div className="text-xs text-text-secondary">
                    {renewalInfo.secondaryText}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col mt-4 px-4 gap-2">
          <button
            onClick={handleActivateSubscription}
            disabled={isActivating || !vehicleTokenId}
            className={`${RESPONSIVE.touch} ${BORDER_RADIUS.full} font-medium w-full ${
              isActivating || !vehicleTokenId
                ? COLORS.button.disabled
                : COLORS.button.primary
            }`}
            type="button"
          >
            {isActivating
              ? (isCanceled ? 'Checking Payment Method...' : 'Activating...')
              : (isCanceled ? 'Reactivate Subscription' : 'Activate Subscription')}
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className={`${RESPONSIVE.touch} ${COLORS.button.tertiary} ${BORDER_RADIUS.full} font-medium w-full`}
            type="button"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </>
  );
};

export default ConnectionSubscriptionDetailCard;
