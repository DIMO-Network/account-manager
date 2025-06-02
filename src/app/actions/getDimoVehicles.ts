'use server';

import { currentUser } from '@clerk/nextjs/server';
import { DimoAPI } from '@/utils/DimoAPI';
import { logger } from '@/libs/Logger';

export async function getDimoVehicles() {
  try {
    const user = await currentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const walletAddress = user.publicMetadata.walletAddress as string;

    if (!walletAddress) {
      logger.warn('Wallet address not found in user metadata', { userId: user.id });
      return {
        success: false,
        error: 'Wallet address not found in user metadata'
      };
    }

    const dimoAPI = new DimoAPI();
    const result = await dimoAPI.getVehiclesByOwner(walletAddress);
    
    logger.info('Successfully fetched DIMO vehicles', { 
      userId: user.id, 
      walletAddress, 
      vehicleCount: result.data?.vehicles?.totalCount || 0 
    });
    
    return {
      success: true,
      vehicles: result.data?.vehicles?.edges?.map((edge: any) => edge.node) || [],
      totalCount: result.data?.vehicles?.totalCount || 0
    };
  } catch (error) {
    logger.error('Error fetching DIMO vehicles', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}