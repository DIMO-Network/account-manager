import { getDimoVehicleDetails } from '@/app/actions/getDimoVehicleDetails';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

type VehicleDetailPageProps = {
  params: Promise<{ locale: string; tokenId: string }>;
};

export async function generateMetadata(props: VehicleDetailPageProps) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'VehicleDetail',
  });

  return {
    title: t('meta_title'),
  };
}

export default async function VehicleDetailPage(props: VehicleDetailPageProps) {
  const { locale, tokenId } = await props.params;
  setRequestLocale(locale);

  const result = await getDimoVehicleDetails(tokenId);

  if (!result.success || !result.vehicle) {
    notFound();
  }

  const { vehicle } = result;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {vehicle.definition.year} {vehicle.definition.make} {vehicle.definition.model}
        </h1>
        <p className="text-gray-600">Token ID: {vehicle.tokenId}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Vehicle Information</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Make:</span>
              <span>{vehicle.definition.make}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Model:</span>
              <span>{vehicle.definition.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Year:</span>
              <span>{vehicle.definition.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Owner:</span>
              <span className="font-mono text-xs">{vehicle.owner}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Connected:</span>
              <span>{new Date(vehicle.mintedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Aftermarket Device */}
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Device Connection</h2>
          {vehicle.aftermarketDevice ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Device ID:</span>
                <span>{vehicle.aftermarketDevice.tokenId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Manufacturer:</span>
                <span>{vehicle.aftermarketDevice.manufacturer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Device Owner:</span>
                <span className="font-mono text-xs">{vehicle.aftermarketDevice.owner}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paired:</span>
                <span>{new Date(vehicle.aftermarketDevice.pairedAt).toLocaleDateString()}</span>
              </div>
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                <span className="text-green-800 text-xs font-medium">✓ Device Connected</span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800 text-sm">No aftermarket device connected</p>
            </div>
          )}
        </div>

        {/* Synthetic Device */}
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Synthetic Device</h2>
          {vehicle.syntheticDevice ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Device ID:</span>
                <span>{vehicle.syntheticDevice.tokenId}</span>
              </div>
              {/* Add more synthetic device fields as needed */}
            </div>
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <p className="text-gray-600 text-sm">No synthetic device</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}