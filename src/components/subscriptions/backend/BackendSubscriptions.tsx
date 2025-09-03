import type { BackendSubscription } from '@/types/subscription';
import { useEffect, useMemo, useState } from 'react';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';
import { BackendSubscriptionItem } from './BackendSubscriptionItem';

function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-900 rounded ${className}`} />
  );
}

export function BackendSubscriptions({ statuses }: { statuses: BackendSubscription[] }) {
  const [vehicleStatuses, setVehicleStatuses] = useState<Record<number, boolean>>({});
  // Start with loading true if we have subscriptions to check (excluding S1 connections)
  const [isLoadingVehicleStatuses, setIsLoadingVehicleStatuses] = useState(() => {
    const hasVehiclesToCheck = statuses.some(status =>
      status.device?.vehicle?.tokenId && status.device?.connection?.name !== 'Kaufmann-Oracle',
    );
    return hasVehiclesToCheck;
  });

  // Check vehicle statuses on mount
  useEffect(() => {
    const checkVehicleStatuses = async () => {
      // Skip vehicle status check for S1 connections (Kaufmann-Oracle)
      const vehicleTokenIds = statuses
        .filter(status => status.device?.connection?.name !== 'Kaufmann-Oracle')
        .map(status => status.device?.vehicle?.tokenId)
        .filter((tokenId): tokenId is number => tokenId !== undefined);

      if (vehicleTokenIds.length === 0) {
        setIsLoadingVehicleStatuses(false);
        setVehicleStatuses({});
        return;
      }

      setIsLoadingVehicleStatuses(true);

      try {
        const response = await fetch('/api/subscriptions/vehicle-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ vehicleTokenIds }),
        });

        if (response.ok) {
          const { vehicleStatuses } = await response.json();
          setVehicleStatuses(vehicleStatuses);
        }
      } catch (error) {
        console.error('Error checking vehicle statuses:', error);
      } finally {
        setIsLoadingVehicleStatuses(false);
      }
    };

    checkVehicleStatuses();
  }, [statuses]);

  const filteredStatuses = useMemo(() =>
    statuses.filter((status) => {
      // Exclude subscriptions without device info
      if (!status.device) {
        return false;
      }

      // Exclude subscriptions where vehicle is null
      if (!status.device.vehicle) {
        return false;
      }

      // For S1 connections, skip vehicle status check entirely (rely on Identity API data)
      if (status.device.connection?.name === 'Kaufmann-Oracle') {
        // S1 vehicles are always valid since we get data directly from Identity API
        return true;
      }

      // Exclude subscriptions where vehicle returns 404 (burned tokens)
      // Only filter out if we have confirmed the vehicle doesn't exist
      if (!isLoadingVehicleStatuses
        && status.device.vehicle.tokenId
        && vehicleStatuses[status.device.vehicle.tokenId] === false) {
        return false;
      }

      // Include all non-canceled subscriptions
      if (status.status !== 'canceled') {
        return true;
      }

      // For canceled subscriptions, only include Ruptela, AutoPi, Tesla, and S1 devices
      if (status.device.manufacturer?.name) {
        const manufacturerName = status.device.manufacturer.name;
        return manufacturerName === 'Ruptela' || manufacturerName === 'AutoPi';
      }

      // Include canceled Tesla subscriptions
      if (status.device.connection?.name === 'Tesla') {
        return true;
      }

      // Include canceled S1 subscriptions (Kaufmann-Oracle)
      if (status.device.connection?.name === 'Kaufmann-Oracle') {
        return true;
      }

      // Exclude canceled subscriptions without device/manufacturer info
      return false;
    }), [statuses, vehicleStatuses, isLoadingVehicleStatuses]);

  // Show loading state while checking vehicle statuses
  if (isLoadingVehicleStatuses) {
    return (
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
    );
  }

  if (filteredStatuses.length === 0) {
    return <p className="text-base font-medium leading-6">No devices found.</p>;
  }

  return (
    <ul className="space-y-4">
      {filteredStatuses.map((status) => {
        const device = status.device;
        const key = device?.tokenId
          ? `device-${device.tokenId}`
          : `status-${status.stripe_id || status.start_date}-${status.status}`;

        return (
          <BackendSubscriptionItem key={key} status={status} />
        );
      })}
    </ul>
  );
}
