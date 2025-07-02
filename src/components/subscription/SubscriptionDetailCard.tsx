import React from 'react';
import { useVehicleDetails } from '@/hooks/useVehicleDetails';

type SubscriptionDetailCardProps = {
  subscription: any;
};

export const SubscriptionDetailCard: React.FC<SubscriptionDetailCardProps> = ({ subscription }) => {
  const metadata = subscription?.metadata || {};
  const connectionId = metadata.connectionId || 'N/A';
  const vehicleTokenId = metadata.vehicleTokenId || 'N/A';
  // Placeholder for type (annual/monthly)
  const type = 'Annual or Monthly';
  const renewsOn = subscription?.current_period_end
    ? new Date(subscription.current_period_end * 1000).toLocaleDateString()
    : 'N/A';

  const { vehicleInfo, vehicleLoading, vehicleError } = useVehicleDetails(vehicleTokenId);

  return (
    <div className="p-4 bg-surface-raised rounded-2xl flex flex-col justify-between">
      <h1 className="text-2xl font-bold mb-4">Subscription Detail</h1>
      <div className="min-w-full bg-surface-default rounded-xl p-4">
        <table className="w-full">
          <tbody>
            {/* Connection Id */}
            <tr>
              <td className="font-medium text-base leading-5 pb-2">Connection Id</td>
            </tr>
            <tr>
              <td className="font-light text-xs leading-5 break-all pb-3 border-b border-gray-700">{connectionId}</td>
            </tr>
            {/* Connected To */}
            <tr>
              <td className="font-medium text-base leading-5 pt-4 pb-2">Connected To</td>
            </tr>
            <tr>
              <td className="font-light text-xs leading-5 pb-1">
                {vehicleLoading && 'Loading vehicle...'}
                {vehicleError && <span className="text-red-500">{vehicleError}</span>}
                {!vehicleLoading && !vehicleError && vehicleInfo && (
                  <>
                    <div>{vehicleInfo.year && vehicleInfo.make && vehicleInfo.model ? `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}` : 'N/A'}</div>
                    <div className="text-xs text-gray-400">{vehicleInfo.dcn || vehicleInfo.name || 'N/A'}</div>
                  </>
                )}
                {!vehicleLoading && !vehicleError && !vehicleInfo && vehicleTokenId}
              </td>
            </tr>
            <tr>
              <td className="font-light text-xs leading-5 pb-3 border-b border-gray-700"></td>
            </tr>
            {/* Type */}
            <tr>
              <td className="font-medium text-base leading-5 pt-4 pb-2">Type</td>
            </tr>
            <tr>
              <td className="font-light text-xs leading-5 pb-3 border-b border-gray-700">{type}</td>
            </tr>
            {/* Renews on */}
            <tr>
              <td className="font-medium text-base leading-5 pt-4 pb-2">Renews on</td>
            </tr>
            <tr>
              <td className="font-light text-xs leading-5 pb-3 border-b border-gray-700">{renewsOn}</td>
            </tr>
          </tbody>
        </table>
        <button
          className="mt-6 py-2 px-4 rounded bg-gray-200 text-gray-500 cursor-not-allowed w-full"
          disabled
          aria-disabled="true"
          title="Cancel subscription feature coming soon"
          type="button"
        >
          Cancel Subscription
        </button>
      </div>
    </div>
  );
};

export default SubscriptionDetailCard;
