import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { stripe } from '@/libs/Stripe';
import { deviceSubscriptionSchema } from '@/models/Schema';

export class SubscriptionService {
  static async checkDeviceSubscription(serialNumber: string) {
    try {
      // Always check Stripe first for the most up-to-date status
      const stripeSearch = await stripe.subscriptions.search({
        query: `metadata['serial_number']:'${serialNumber}'`,
        limit: 10,
      });

      // Filter for truly active subscriptions
      const activeSubscriptions = stripeSearch.data.filter(sub =>
        sub.status === 'active' || sub.status === 'trialing',
      );

      const hasActiveSubscription = activeSubscriptions.length > 0;
      const subscription = activeSubscriptions[0] || null;

      // Update local database with current status
      if (stripeSearch.data.length > 0) {
        const latestSubscription = stripeSearch.data[0];
        await this.updateLocalSubscription(serialNumber, latestSubscription);
      }

      return {
        hasActiveSubscription,
        subscription: subscription
          ? {
              id: subscription.id,
              status: subscription.status,
              planType: subscription.metadata.plan_type || 'basic',
            }
          : null,
        source: 'stripe',
      };
    } catch (error) {
      console.error('Error checking device subscription:', error);

      // Fallback to local database only if Stripe fails
      const localSubscription = await db.query.deviceSubscriptionSchema.findFirst({
        where: eq(deviceSubscriptionSchema.serialNumber, serialNumber),
      });

      return {
        hasActiveSubscription: localSubscription?.isActive || false,
        subscription: localSubscription,
        source: 'local',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Update this method to handle status changes
  private static async updateLocalSubscription(
    serialNumber: string,
    stripeSubscription: any,
  ) {
    const isActive = stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing';

    await db.insert(deviceSubscriptionSchema).values({
      serialNumber,
      stripeCustomerId: stripeSubscription.customer,
      stripeSubscriptionId: stripeSubscription.id,
      subscriptionStatus: stripeSubscription.status,
      planType: stripeSubscription.metadata.plan_type || 'basic',
      isActive,
    }).onConflictDoUpdate({
      target: deviceSubscriptionSchema.serialNumber,
      set: {
        stripeCustomerId: stripeSubscription.customer,
        stripeSubscriptionId: stripeSubscription.id,
        subscriptionStatus: stripeSubscription.status,
        isActive,
        updatedAt: new Date(),
      },
    });
  }
}
