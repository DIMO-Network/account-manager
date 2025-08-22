import type { BackendSubscription } from '@/types/subscription';

/**
 * Fetches all backend subscription statuses for a user
 */
export async function fetchBackendSubscriptions(dimoToken: string): Promise<BackendSubscription[] | null> {
  try {
    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/subscription/status/all`;
    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${dimoToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch backend data:', response.status, response.statusText, errorText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching backend subscription statuses:', error);
    return null;
  }
}

/**
 * Checks if all subscription stripe_id values are null or undefined
 */
export function areAllStripeIdsNull(subscriptions: BackendSubscription[] | null): boolean {
  return subscriptions?.every(sub =>
    sub.stripe_id === null || sub.stripe_id === undefined,
  ) ?? true;
}

/**
 * Checks if a user owns a specific subscription
 */
export async function checkUserOwnsSubscription(subscriptionId: string, dimoToken: string): Promise<boolean> {
  try {
    const userSubscriptions = await fetchBackendSubscriptions(dimoToken);

    if (!userSubscriptions) {
      return false;
    }

    // Check if the subscription ID exists in the user's subscriptions
    return userSubscriptions.some(sub => sub.stripe_id === subscriptionId);
  } catch (error) {
    console.error('Error checking subscription ownership:', error);
    return false;
  }
}

/**
 * Authorization function that accepts user info as parameters
 */
export async function authorizeSubscriptionAccess(
  subscriptionId: string,
  dimoToken: string | null,
  jwtToken?: string | null,
): Promise<{ authorized: boolean; error?: string }> {
  try {
    // Try DIMO token first (from user metadata)
    if (dimoToken) {
      const userOwnsSubscription = await checkUserOwnsSubscription(subscriptionId, dimoToken);
      if (userOwnsSubscription) {
        return { authorized: true };
      }
    }

    // Try JWT token from cookies (for URL passthrough authentication)
    if (jwtToken) {
      const userOwnsSubscription = await checkUserOwnsSubscription(subscriptionId, jwtToken);
      if (userOwnsSubscription) {
        return { authorized: true };
      }
    }

    // If neither token worked, user doesn't own the subscription
    if (!dimoToken && !jwtToken) {
      return { authorized: false, error: 'DIMO authentication required' };
    }

    return { authorized: false, error: 'Subscription not found' };
  } catch (error) {
    console.error('Error in subscription authorization:', error);
    return { authorized: false, error: 'Authorization failed' };
  }
}

/**
 * Authorization function for connection subscriptions
 */
export async function authorizeConnectionSubscriptionAccess(
  vehicleTokenId: string,
  dimoToken: string | null,
): Promise<{
  authorized: boolean;
  subscription?: BackendSubscription;
  error?: string;
}> {
  try {
    if (!dimoToken) {
      return { authorized: false, error: 'DIMO authentication required' };
    }

    const backendSubscriptions = await fetchBackendSubscriptions(dimoToken);
    if (!backendSubscriptions) {
      return { authorized: false, error: 'Failed to fetch subscriptions' };
    }

    // Find the subscription that matches the vehicle tokenId and has either a connection or manufacturer
    const subscription = backendSubscriptions.find(
      sub => sub.device?.vehicle?.tokenId === Number.parseInt(vehicleTokenId, 10)
        && (sub.device?.connection?.name || sub.device?.manufacturer?.name),
    );

    if (!subscription || !subscription.device) {
      return { authorized: false, error: 'Subscription not found for this vehicle' };
    }

    // Only allow access to canceled subscriptions for reactivation
    if (subscription.status !== 'canceled') {
      return { authorized: false, error: 'Subscription is not canceled', subscription };
    }

    return { authorized: true, subscription };
  } catch (error) {
    console.error('Error in connection subscription authorization:', error);
    return { authorized: false, error: 'Authorization failed' };
  }
}
