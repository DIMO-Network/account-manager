'use server';

import type { GetVehiclesByOwnerQuery } from '@/generated/graphql';
import { graphql } from '@/generated';
import { getSession } from '@/libs/Session';

const GET_VEHICLES_BY_OWNER = graphql(`
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
            manufacturer {
              name
            }
          }
        }
      }
    }
  }
`);

export type Vehicle = GetVehiclesByOwnerQuery['vehicles']['edges'][0]['node'];

export async function getDimoVehicles(): Promise<{
  success: boolean;
  vehicles: Vehicle[];
  error?: string;
}> {
  try {
    const session = await getSession();

    if (!session) {
      return { success: false, vehicles: [], error: 'User not authenticated' };
    }

    const walletAddress = session.walletAddress;

    if (!walletAddress) {
      return { success: false, vehicles: [], error: 'No wallet address found' };
    }

    const response = await fetch('https://identity-api.dimo.zone/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_VEHICLES_BY_OWNER,
        variables: { owner: walletAddress, first: 100 },
      }),
    });

    const data = await response.json();

    if (data.data?.vehicles?.edges) {
      const vehicles: Vehicle[] = data.data.vehicles.edges.map((edge: any) => edge.node);
      return { success: true, vehicles };
    }

    return { success: true, vehicles: [] };
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return {
      success: false,
      vehicles: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
