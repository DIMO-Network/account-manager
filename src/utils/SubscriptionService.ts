import type Stripe from 'stripe';
import type { LocalSubscription, SubscriptionData } from '@/types/subscription';
import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { stripe } from '@/libs/Stripe';
import { deviceSubscriptionSchema } from '@/models/Schema';

export class SubscriptionService {
  // Type guard for active subscriptions
  private static isActiveSubscription(subscription: Stripe.Subscription): boolean {
    return subscription.status === 'active' || subscription.status === 'trialing';
  }

  static async checkDeviceSubscription(serialNumber: string): Promise<SubscriptionData> {
    try {
      // Always check Stripe first for the most up-to-date status
      const stripeSearch = await stripe().subscriptions.search({
        query: `metadata['serial_number']:'${serialNumber}'`,
        limit: 10,
      });

      // Check if we found any subscriptions
      if (stripeSearch.data.length === 0) {
        return {
          hasActiveSubscription: false,
          subscription: null,
          source: 'stripe',
        };
      }

      // Filter for truly active subscriptions
      const activeSubscriptions = stripeSearch.data.filter(this.isActiveSubscription);

      const hasActiveSubscription = activeSubscriptions.length > 0;
      const subscription = activeSubscriptions[0] || null;

      // Update local database with the latest subscription (first in the list)
      const latestSubscription = stripeSearch.data[0]!; // We know it exists because we checked length above
      await this.updateLocalSubscription(serialNumber, latestSubscription);

      return {
        hasActiveSubscription,
        subscription: subscription
          ? {
              id: subscription.id,
              status: subscription.status,
              planType: subscription.metadata?.plan_type || 'basic',
            }
          : null,
        source: 'stripe',
      };
    } catch (error) {
      console.error('Error checking device subscription:', error);

      // Fallback to local database only if Stripe fails
      const localSubscription = await db.query.deviceSubscriptionSchema.findFirst({
        where: eq(deviceSubscriptionSchema.serialNumber, serialNumber),
      }) as LocalSubscription | undefined;

      // Format local subscription to match the expected return type
      const formattedSubscription = localSubscription && localSubscription.isActive
        ? {
            id: localSubscription.stripeSubscriptionId || `local_${localSubscription.id}`,
            status: localSubscription.subscriptionStatus || 'unknown',
            planType: localSubscription.planType || 'basic',
          }
        : null;

      return {
        hasActiveSubscription: localSubscription?.isActive || false,
        subscription: formattedSubscription,
        source: 'local',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Update this method to handle status changes
  private static async updateLocalSubscription(
    serialNumber: string,
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const isActive = this.isActiveSubscription(stripeSubscription);

    await db.insert(deviceSubscriptionSchema).values({
      serialNumber,
      stripeCustomerId: stripeSubscription.customer as string,
      stripeSubscriptionId: stripeSubscription.id,
      subscriptionStatus: stripeSubscription.status,
      planType: stripeSubscription.metadata?.plan_type || 'basic',
      isActive,
    }).onConflictDoUpdate({
      target: deviceSubscriptionSchema.serialNumber,
      set: {
        stripeCustomerId: stripeSubscription.customer as string,
        stripeSubscriptionId: stripeSubscription.id,
        subscriptionStatus: stripeSubscription.status,
        isActive,
        updatedAt: new Date(),
      },
    });
  }

  static async cancelSubscription(subscriptionId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const canceledSubscription = await stripe().subscriptions.cancel(subscriptionId);

      // Update local database to reflect cancellation
      if (canceledSubscription.metadata?.serial_number) {
        await db.update(deviceSubscriptionSchema)
          .set({
            subscriptionStatus: 'canceled',
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(deviceSubscriptionSchema.serialNumber, canceledSubscription.metadata.serial_number));
      }

      return { success: true };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
