import { getSession } from '@/libs/Session';
import { stripe } from '@/libs/Stripe';
import type { StripeCancellationFeedback } from '@/libs/StripeSubscriptionService';
import type { SubscriptionData } from '@/types/subscription';

export class SubscriptionService {
  static async checkDeviceSubscription(connectionId: string): Promise<SubscriptionData> {
    try {
      const session = await getSession();
      const dimoToken = session?.dimoToken;

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
      const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001'}/subscription/status/${encodedConnectionId}`;

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

      // First, retrieve the subscription to check its status and schedule
      const subscription = await stripe().subscriptions.retrieve(subscriptionId);

      // Check if subscription has a schedule
      if (subscription.schedule) {
        // For scheduled subscriptions, cancel the schedule at the end of the trial period
        const scheduleId = typeof subscription.schedule === 'string'
          ? subscription.schedule
          : subscription.schedule.id;

        if (subscription.status === 'trialing') {
          // Cancel the schedule at the end of the trial period
          await stripe().subscriptionSchedules.update(scheduleId, {
            end_behavior: 'cancel',
          });
        } else {
          // Cancel the schedule immediately for non-trialing subscriptions
          await stripe().subscriptionSchedules.cancel(scheduleId);
        }
      } else if (subscription.status === 'trialing') {
        // For trialing subscriptions without schedule, cancel at period end (after trial)
        await stripe().subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
          cancellation_details: stripeCancellationDetails,
        });
      } else {
        // For active subscriptions, cancel at period end
        await stripe().subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
          cancellation_details: stripeCancellationDetails,
        });
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
}
