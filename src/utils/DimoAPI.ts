export class DimoAPI {
  private baseUrl = 'https://identity-api.dimo.zone';

  async query(query: string, variables?: any) {
    const response = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async getVehiclesByOwner(ownerAddress: string, limit: number = 10) {
    const query = `
    query GetVehiclesByOwner($owner: Address!, $first: Int!) {
      vehicles(filterBy: { owner: $owner }, first: $first) {
        totalCount
        edges {
          node {
            tokenId
            owner
            mintedAt
            definition {
              make
              model
              year
            }
            aftermarketDevice {
              tokenId
              tokenDID
              serial
              owner
              pairedAt
              mintedAt
              claimedAt
              manufacturer {
                name
              }
            }
          }
        }
      }
    }
  `;

    return this.query(query, { owner: ownerAddress, first: limit });
  }

  async getR1DeviceSerials(ownerAddress: string) {
    const vehiclesData = await this.getVehiclesByOwner(ownerAddress, 100);

    const serials: string[] = [];

    if (vehiclesData.data?.vehicles?.edges) {
      for (const edge of vehiclesData.data.vehicles.edges) {
        const device = edge.node.aftermarketDevice;
        if (device?.serial && device.manufacturer?.name === 'Ruptela') {
          serials.push(device.serial);
        }
      }
    }

    return serials;
  }

  async getVehiclesWithR1Devices(ownerAddress: string) {
    const vehiclesData = await this.getVehiclesByOwner(ownerAddress, 100);

    const vehiclesWithR1: any[] = [];

    if (vehiclesData.data?.vehicles?.edges) {
      for (const edge of vehiclesData.data.vehicles.edges) {
        const vehicle = edge.node;
        if (vehicle.aftermarketDevice?.serial
          && vehicle.aftermarketDevice.manufacturer?.name === 'Ruptela') {
          vehiclesWithR1.push(vehicle);
        }
      }
    }

    return vehiclesWithR1;
  }
}
