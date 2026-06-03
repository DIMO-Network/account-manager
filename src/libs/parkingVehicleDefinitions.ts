import type { VehicleDefinitionSummary } from '@/components/parking/parkingDisplayHelpers';
import { getDimoVehicleDetails } from '@/app/actions/getDimoVehicleDetails';

import 'server-only';

export async function resolveVehicleDefinitionsByTokenId(
  tokenIds: number[],
): Promise<Map<number, VehicleDefinitionSummary>> {
  const unique = [...new Set(tokenIds)];
  const map = new Map<number, VehicleDefinitionSummary>();

  await Promise.all(
    unique.map(async (tokenId) => {
      const result = await getDimoVehicleDetails(String(tokenId));
      const definition = result.success ? result.vehicle?.definition : null;
      if (definition?.make && definition?.model && definition?.year) {
        map.set(tokenId, {
          year: definition.year,
          make: definition.make,
          model: definition.model,
        });
      }
    }),
  );

  return map;
}
