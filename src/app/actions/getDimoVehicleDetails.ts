'use server';

interface VehicleDetail {
  tokenId: string;
  owner: string;
  mintedAt: string;
  definition: {
    make: string;
    model: string;
    year: number;
  };
  aftermarketDevice?: {
    tokenId: number;
    owner: string;
    pairedAt: string;
    manufacturer: {
      name: string;
    };
  };
  syntheticDevice?: {
    tokenId: number;
    // Add other synthetic device fields as needed
  } | null;
}

export async function getDimoVehicleDetails(tokenId: string): Promise<{
  success: boolean;
  vehicle?: VehicleDetail;
  error?: string;
}> {
  try {
    // Replace with your actual DIMO API endpoint and authentication
    const response = await fetch(`https://identity-api.dimo.zone/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add your API key or auth headers here
      },
      body: JSON.stringify({
        query: `
          query GetVehicle($tokenId: Int!) {
            vehicle(tokenId: $tokenId) {
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
                owner
                pairedAt
                manufacturer {
                  name
                }
              }
              syntheticDevice {
                tokenId
              }
            }
          }
        `,
        variables: {
          tokenId: parseInt(tokenId)
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0]?.message || 'GraphQL query failed');
    }

    if (!data.data?.vehicle) {
      return {
        success: false,
        error: 'Vehicle not found'
      };
    }

    return {
      success: true,
      vehicle: data.data.vehicle
    };
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}