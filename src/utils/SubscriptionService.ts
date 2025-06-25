import type Stripe from 'stripe';
import type { SubscriptionData } from '@/types/subscription';
import { eq } from 'drizzle-orm';
import { getDB } from '@/libs/DB';
import { stripe } from '@/libs/Stripe';
import { dataSourcesSchema, subscriptionsSchema } from '@/models/Schema';

export class SubscriptionService {
  // Type guard for active subscriptions
  private static isActiveSubscription(subscription: Stripe.Subscription): boolean {
    return subscription.status === 'active' || subscription.status === 'trialing';
  }

  static async checkDeviceSubscription(connectionId: string): Promise<SubscriptionData> {
    try {
      const db = await getDB();
      // First check local database (DIMO backend tables)
      const localResult = await db
        .select({
          // Data source fields
          connectionId: dataSourcesSchema.connectionId,
          connectionStatus: dataSourcesSchema.connectionStatus,
          vehicleTokenId: dataSourcesSchema.vehicleTokenId,
          trialEndDate: dataSourcesSchema.trialEndDate,
          // Subscription fields
          subscriptionId: subscriptionsSchema.id,
          stripeSubscriptionId: subscriptionsSchema.stripeId,
          status: subscriptionsSchema.status,
          currency: subscriptionsSchema.currency,
          startedAt: subscriptionsSchema.startedAt,
          endedAt: subscriptionsSchema.endedAt,
        })
        .from(dataSourcesSchema)
        .leftJoin(subscriptionsSchema, eq(dataSourcesSchema.subscriptionId, subscriptionsSchema.id))
        .where(eq(dataSourcesSchema.connectionId, connectionId))
        .limit(1);

      const localSubscription = localResult[0];

      if (!localSubscription) {
        return {
          hasActiveSubscription: false,
          subscription: null,
          source: 'local',
        };
      }

      // Check if the subscription is active locally
      const isLocallyActive = localSubscription.status === 'active' || localSubscription.status === 'trialing';

      // If we have a Stripe subscription ID, verify with Stripe for real-time status
      if (localSubscription.stripeSubscriptionId && isLocallyActive) {
        try {
          const stripeSubscription = await stripe().subscriptions.retrieve(localSubscription.stripeSubscriptionId);
          const isStripeActive = this.isActiveSubscription(stripeSubscription);

          return {
            hasActiveSubscription: isStripeActive,
            subscription: isStripeActive
              ? {
                  id: stripeSubscription.id,
                  status: stripeSubscription.status,
                  planType: stripeSubscription.metadata?.plan_type || 'basic',
                }
              : null,
            source: 'stripe',
          };
        } catch (stripeError) {
          console.warn('Stripe verification failed, using local data:', stripeError);
        }
      }

      return {
        hasActiveSubscription: isLocallyActive,
        subscription: isLocallyActive
          ? {
              id: localSubscription.stripeSubscriptionId || `local_${localSubscription.subscriptionId}`,
              status: localSubscription.status || 'unknown',
              planType: 'basic', // Store this in the backend?
            }
          : null,
        source: 'local',
      };
    } catch (error) {
      console.error('Error checking device subscription:', error);
      return {
        hasActiveSubscription: false,
        subscription: null,
        source: 'local',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async cancelSubscription(subscriptionId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
    // Only cancel in Stripe - let the DIMO backend handle database updates via webhooks
      await stripe().subscriptions.cancel(subscriptionId);

      return { success: true };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getSubscriptionDetails(connectionId: string) {
    try {
      const db = await getDB();

      const result = await db
        .select()
        .from(dataSourcesSchema)
        .leftJoin(subscriptionsSchema, eq(dataSourcesSchema.subscriptionId, subscriptionsSchema.id))
        .where(eq(dataSourcesSchema.connectionId, connectionId))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error getting subscription details:', error);
      return null;
    }
  }
}
