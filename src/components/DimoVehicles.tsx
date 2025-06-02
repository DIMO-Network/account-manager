'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDimoVehicles } from '@/app/actions/getDimoVehicles';

interface Vehicle {
  tokenId: string;
  owner: string;
  mintedAt: string;
  definition: {
    make: string;
    model: string;
    year: number;
  };
}

export const DimoVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await getDimoVehicles();
        
        if (result.success) {
          setVehicles(result.vehicles);
        } else {
          setError(result.error || 'Failed to fetch vehicles');
        }
      } catch (err) {
        console.error('Error fetching vehicles:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  const handleVehicleClick = (tokenId: string) => {
    router.push(`/dashboard/vehicles/${tokenId}`);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">Loading your DIMO vehicles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <h3 className="text-red-800 font-semibold">Error loading vehicles</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Your DIMO Vehicles</h2>
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <p className="text-blue-800">
            No vehicles found for your wallet address. 
          </p>
          <p className="text-blue-600 text-sm mt-2">
            Make sure you have connected vehicles to the DIMO network using the same wallet address.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Your DIMO Vehicles ({vehicles.length})</h2>
      <div className="grid gap-4">
        {vehicles.map((vehicle) => (
          <div 
            key={vehicle.tokenId} 
            className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md hover:bg-gray-50 cursor-pointer transition-all duration-200 transform hover:scale-[1.02]"
            onClick={() => handleVehicleClick(vehicle.tokenId)}
          >
            <h3 className="font-semibold text-lg">
              {vehicle.definition.year} {vehicle.definition.make} {vehicle.definition.model}
            </h3>
            <div className="text-sm text-gray-600 space-y-1 mt-2">
              <p>Token ID: {vehicle.tokenId}</p>
              <p>Owner: {vehicle.owner}</p>
              <p>Connected: {new Date(vehicle.mintedAt).toLocaleDateString()}</p>
            </div>
            <div className="mt-3 flex items-center text-blue-600 text-sm font-medium">
              <span>View Details</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};