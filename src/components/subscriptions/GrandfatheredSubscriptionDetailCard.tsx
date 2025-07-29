'use client';

import type { BackendSubscription } from '@/types/subscription';
import { useRouter } from 'next/navigation';
import React from 'react';
import { CarIcon } from '@/components/Icons';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';
import { getBackendSubscriptionRenewalInfo } from './utils/subscriptionDisplayHelpers';

type GrandfatheredSubscriptionDetailCardProps = {
  subscription: BackendSubscription;
};

export const GrandfatheredSubscriptionDetailCard: React.FC<GrandfatheredSubscriptionDetailCardProps> = ({ subscription }) => {
  const router = useRouter();
  const device = subscription.device;

  if (!device) {
    return null;
  }

  const serialNumber = device.serial || `Token ID: ${device.tokenId}`;
  const serialLabel = device.serial ? 'Serial Number' : 'Token ID';

  const renewalInfo = getBackendSubscriptionRenewalInfo(subscription);

  // Reusable styles
  const labelStyle = 'font-medium text-base leading-5 px-4 mb-1';
  const valueStyle = 'font-light text-xs leading-5 px-4 pb-3';
  const borderStyle = 'border-b border-gray-700';

  return (
    <>
      <div className="flex flex-row items-center gap-2 border-b border-gray-700 pb-2 mb-4">
        <CarIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
        <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Grandfathered Device Details</h1>
      </div>
      <div className="flex flex-col justify-between bg-surface-default rounded-2xl py-3">
        <div className="space-y-4">
          {/* Serial Number / Token ID */}
          <div>
            <div className={labelStyle}>{serialLabel}</div>
            <div className={`${valueStyle} ${borderStyle}`}>{serialNumber}</div>
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

          {/* Device Type */}
          <div>
            <div className={labelStyle}>Device Type</div>
            <div className={`${valueStyle} ${borderStyle}`}>
              {device.manufacturer?.name || 'N/A'}
            </div>
          </div>

          {/* Claimed Date */}
          <div>
            <div className={labelStyle}>Claimed Date</div>
            <div className={`${valueStyle} ${borderStyle}`}>
              {device.claimedAt
                ? new Date(device.claimedAt).toLocaleDateString('en-US', {
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
          <button
            onClick={() => router.push('/dashboard')}
            className={`${RESPONSIVE.touch} ${COLORS.button.secondary} ${BORDER_RADIUS.full} font-medium w-full mt-2`}
            type="button"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </>
  );
};

export default GrandfatheredSubscriptionDetailCard;
