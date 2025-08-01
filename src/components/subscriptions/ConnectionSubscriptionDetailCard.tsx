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
  const [showConfirmActivation, setShowConfirmActivation] = useState(false);
  const device = subscription.device;

  if (!device) {
    return null;
  }

  const vehicleTokenId = device.vehicle?.tokenId;
  const connectionName = device.connection?.name || 'Unknown Connection';

  const renewalInfo = getBackendSubscriptionRenewalInfo(subscription, device);

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
        // Show confirmation for direct subscription activation
        setShowConfirmActivation(true);
        setIsActivating(false);
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

      // Open checkout session in new tab
      window.open(checkout_url, '_blank');

      // TODO: Make redirect_uri in backend customizable
      router.push('/dashboard');
    } catch (error) {
      console.error('Error activating subscription:', error);
      // TODO: Add proper error handling/notification
    } finally {
      setIsActivating(false);
    }
  };

  const handleConfirmActivation = async () => {
    setIsActivating(true);
    try {
      if (!vehicleTokenId) {
        throw new Error('No vehicle token ID found');
      }

      const response = await fetch(`/api/subscriptions/vehicle/${vehicleTokenId}/new-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to activate subscription');
      }

      // Subscription activated successfully
      setShowConfirmActivation(false);
      // TODO: Add success notification and refresh data
      console.warn('Subscription activated successfully');

      router.push('/dashboard');
    } catch (error) {
      console.error('Error confirming subscription activation:', error);
      // TODO: Add proper error handling/notification
    } finally {
      setIsActivating(false);
    }
  };

  const handleCancelActivation = () => {
    setShowConfirmActivation(false);
  };

  // Reusable styles
  const labelStyle = 'font-light text-xs leading-5 px-4 mb-1';
  const valueStyle = 'font-medium text-base leading-5 px-4 pb-3';
  const borderStyle = 'border-b border-gray-700';

  return (
    <>
      <PageHeader icon={<CarIcon />} title={`${connectionName} Connection Details`} className="mb-4" />
      <div className="flex flex-col justify-between bg-surface-default rounded-2xl py-3">
        <div className="space-y-4">
          {/* Connection Type */}
          <div>
            <div className={labelStyle}>Connection Type</div>
            <div className={`${valueStyle} ${borderStyle}`}>
              {connectionName}
            </div>
          </div>

          {/* Connected To */}
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

          {/* Connection Date */}
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

          {/* Schedule */}
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
        </div>

        <div className="flex flex-col mt-4 px-4 gap-2">
          {!showConfirmActivation
            ? (
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
                  {isActivating ? 'Activating...' : 'Activate Subscription'}
                </button>
              )
            : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleConfirmActivation}
                    disabled={isActivating}
                    className={`${RESPONSIVE.touch} ${BORDER_RADIUS.full} font-medium flex-1 ${
                      isActivating
                        ? COLORS.button.disabledTransparent
                        : COLORS.button.primary
                    }`}
                    type="button"
                  >
                    {isActivating ? 'Activating...' : 'Confirm'}
                  </button>
                  <button
                    onClick={handleCancelActivation}
                    disabled={isActivating}
                    className={`${RESPONSIVE.touch} ${BORDER_RADIUS.full} font-medium flex-1 ${COLORS.button.secondaryTransparent}`}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              )}

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
