import { currentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import CancelSubscriptionCard from '@/components/subscriptions/CancelSubscriptionCard';
import { stripe } from '@/libs/Stripe';
import { authorizeSubscriptionAccess, fetchSubscriptionWithSchedule } from '@/utils/subscriptionHelpers';
import { PaymentMethodSection } from '../../PaymentMethodSection';

// Helper function to check if subscription should redirect
function shouldRedirectForCancelledSubscription(subscription: any): boolean {
  const isMarkedForCancellation = subscription.cancel_at_period_end && subscription.cancel_at;
  const isAlreadyCancelled = subscription.status === 'canceled';
  const isInactive = subscription.status === 'incomplete_expired' || subscription.status === 'unpaid';

  return isMarkedForCancellation || isAlreadyCancelled || isInactive;
}

// Helper function to fetch subscription with fallback
async function getSubscriptionWithFallback(subscriptionId: string) {
  try {
    return await fetchSubscriptionWithSchedule(subscriptionId);
  } catch (error) {
    // Check if this is a Next.js redirect error
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }

    // Fallback to direct Stripe call
    try {
      const subscription = await stripe().subscriptions.retrieve(subscriptionId);
      return { subscription, vehicleInfo: undefined, nextScheduledPrice: null, nextScheduledDate: null };
    } catch (stripeError) {
      // Check if this is a Next.js redirect error
      if (stripeError instanceof Error && stripeError.message === 'NEXT_REDIRECT') {
        throw stripeError;
      }

      // If both fail, the subscription doesn't exist
      throw new Error('Subscription not found');
    }
  }
}

export default async function CancelSubscriptionPage({ params }: { params: Promise<{ subscriptionId: string }> }) {
  const { subscriptionId } = await params;

  if (!subscriptionId) {
    notFound();
  }

  // Get current user and check authorization
  const user = await currentUser();
  if (!user) {
    notFound();
  }

  const dimoToken = user.privateMetadata?.dimoToken as string;
  const jwtToken = (await cookies()).get('dimo_jwt')?.value;
  const authResult = await authorizeSubscriptionAccess(subscriptionId, dimoToken, jwtToken);
  if (!authResult.authorized) {
    notFound();
  }

  try {
    const { subscription, vehicleInfo, nextScheduledPrice, nextScheduledDate } = await getSubscriptionWithFallback(subscriptionId);

    // Check if subscription is already marked for cancellation and redirect
    if (shouldRedirectForCancelledSubscription(subscription)) {
      redirect('/dashboard');
    }

    return (
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-3/4">
          <CancelSubscriptionCard
            subscription={subscription}
            vehicleInfo={vehicleInfo}
            nextScheduledPrice={nextScheduledPrice}
            nextScheduledDate={nextScheduledDate}
          />
        </div>
        <PaymentMethodSection />
      </div>
    );
  } catch (error) {
    // Check if this is a Next.js redirect error
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }

    notFound();
  }
}
