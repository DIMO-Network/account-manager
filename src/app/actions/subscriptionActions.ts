'use server';

import { revalidatePath } from 'next/cache';
import { SubscriptionService } from '@/utils/SubscriptionService';

export async function checkSubscriptionAction(serialNumber: string) {
  try {
    const result = await SubscriptionService.checkDeviceSubscription(serialNumber);

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/vehicles/[tokenId]', 'page');

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function createCheckoutAction(
  serialNumber: string,
  userEmail: string,
  priceId: string,
) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/subscriptions/create-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serialNumber, userEmail, priceId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create checkout session');
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
