'use server';

import { graphql } from '@/generated';
import type { GetVehicleQuery } from '@/generated/graphql';

const GET_VEHICLE_DETAILS = graphql(`
  query GetVehicle($tokenId: Int!) {
    vehicle(tokenId: $tokenId) {
      tokenId
      owner
      dcn {
        id
        name
      }
      name
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
        manufacturer {
          name
        }
      }
      syntheticDevice {
        tokenId
      }
    }
  }
`);

export type VehicleDetail = GetVehicleQuery['vehicle'];

export async function getDimoVehicleDetails(tokenId: string): Promise<{
  success: boolean;
  vehicle?: VehicleDetail;
  error?: string;
}> {
  try {
    const response = await fetch(`https://identity-api.dimo.zone/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_VEHICLE_DETAILS,
        variables: {
          tokenId: Number.parseInt(tokenId),
        },
      }),
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
        error: 'Vehicle not found',
      };
    }

    return {
      success: true,
      vehicle: data.data.vehicle,
    };
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
