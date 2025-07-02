import { useEffect, useState } from 'react';

type VehicleInfo = {
  year?: number;
  make?: string;
  model?: string;
  dcn?: string | null;
  name?: string | null;
};

export function useVehicleDetails(vehicleTokenId?: string) {
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicleInfo = async () => {
      if (!vehicleTokenId || vehicleTokenId === 'N/A') {
        return;
      }
      setVehicleLoading(true);
      setVehicleError(null);
      try {
        const res = await fetch('https://identity-api.dimo.zone/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query Vehicle($tokenId: Int!) { vehicle(tokenId: $tokenId) { dcn { id } name definition { make model year } } }`,
            variables: { tokenId: Number(vehicleTokenId) },
          }),
        });
        const data = await res.json();
        const v = data?.data?.vehicle;
        setVehicleInfo({
          year: v?.definition?.year,
          make: v?.definition?.make,
          model: v?.definition?.model,
          dcn: v?.dcn?.id ?? null,
          name: v?.name ?? null,
        });
      } catch {
        setVehicleError('Failed to load vehicle info');
      } finally {
        setVehicleLoading(false);
      }
    };
    fetchVehicleInfo();
  }, [vehicleTokenId]);

  return { vehicleInfo, vehicleLoading, vehicleError };
}
