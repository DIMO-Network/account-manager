import type { SubscriptionData } from '@/types/subscription';
import type { StripeCancellationFeedback } from '@/utils/subscriptionHelpers';
import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { getDB } from '@/libs/DB';
import { stripe } from '@/libs/Stripe';
import { dataSourcesSchema, subscriptionsSchema } from '@/models/Schema';
import { featureFlags } from './FeatureFlags';

export class SubscriptionService {
  static async checkDeviceSubscription(connectionId: string): Promise<SubscriptionData> {
    if (featureFlags.useBackendProxy) {
      try {
        const user = await currentUser();
        const dimoToken = user?.privateMetadata?.dimoToken as string;

        if (!dimoToken) {
          return {
            hasActiveSubscription: false,
            subscription: null,
            source: 'local',
            error: 'DIMO authentication required',
          };
        }

        // URL encode the connectionId for the backend API
        const encodedConnectionId = encodeURIComponent(connectionId);
        const backendUrl = `${featureFlags.backendApiUrl}/subscription/status/${encodedConnectionId}`;

        const response = await fetch(backendUrl, {
          headers: {
            Authorization: `Bearer ${dimoToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Backend API error: ${response.status}`);
        }

        const data = await response.json();
        const isActive = data.status === 'active' || data.status === 'trialing';

        return {
          hasActiveSubscription: isActive,
          subscription: isActive
            ? {
                id: 'backend_subscription',
                status: data.status,
                planType: 'basic',
              }
            : null,
          source: 'backend',
        };
      } catch (error) {
        console.error('Backend API call failed:', error);
        return {
          hasActiveSubscription: false,
          subscription: null,
          source: 'backend',
          error: error instanceof Error ? error.message : 'Backend API failed',
        };
      }
    }

    try {
      const searchQuery = `metadata['connectionId']:'${connectionId}'`;
      const subscriptions = await stripe().subscriptions.search({
        query: searchQuery,
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];
        if (subscription) {
          const isActive = subscription.status === 'active' || subscription.status === 'trialing';

          return {
            hasActiveSubscription: isActive,
            subscription: isActive
              ? {
                  id: subscription.id,
                  status: subscription.status,
                  planType: subscription.metadata?.planType || 'basic',
                }
              : null,
            source: 'stripe',
          };
        }
      }

      return {
        hasActiveSubscription: false,
        subscription: null,
        source: 'stripe',
      };
    } catch (error) {
      console.error('Error checking Stripe:', error);
      return {
        hasActiveSubscription: false,
        subscription: null,
        source: 'stripe',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async cancelSubscription(
    subscriptionId: string,
    cancellationDetails?: {
      feedback: StripeCancellationFeedback;
      comment?: string;
    },
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const stripeCancellationDetails = cancellationDetails
        ? {
            feedback: cancellationDetails.feedback as StripeCancellationFeedback,
            comment: cancellationDetails.comment,
          }
        : undefined;

      await stripe().subscriptions.cancel(subscriptionId, {
        cancellation_details: stripeCancellationDetails,
      });

      return { success: true };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async updateSubscription(
    subscriptionId: string,
    cancellationDetails?: {
      feedback: StripeCancellationFeedback;
      comment?: string;
    },
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const stripeCancellationDetails = cancellationDetails
        ? {
            feedback: cancellationDetails.feedback as StripeCancellationFeedback,
            comment: cancellationDetails.comment,
          }
        : undefined;

      await stripe().subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
        cancellation_details: stripeCancellationDetails,
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating subscription:', error);
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
