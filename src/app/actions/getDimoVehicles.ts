'use server';

import { currentUser } from '@clerk/nextjs/server';
import { DimoAPI } from '@/utils/DimoAPI';

export async function getDimoVehicles() {
  try {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const walletAddress = user.publicMetadata?.walletAddress as string;

    if (!walletAddress) {
      return { success: false, error: 'No wallet address found' };
    }

    const dimoAPI = new DimoAPI();
    const response = await dimoAPI.getVehiclesByOwner(walletAddress);

    if (response.data?.vehicles?.edges) {
      const vehicles = response.data.vehicles.edges.map((edge: any) => edge.node);
      return { success: true, vehicles };
    }

    return { success: true, vehicles: [] };
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
