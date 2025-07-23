import type { EnhancedSubscription } from '@/utils/subscriptionHelpers';
import Link from 'next/link';
import { ChevronRightIcon, ConnectionIcon } from '@/components/Icons';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';
import { getSubscriptionRenewalInfo, getSubscriptionTypeAndPrice } from '@/utils/subscriptionHelpers';

function StripeSubscriptionItem({ subscription }: { subscription: EnhancedSubscription }) {
  return (
    <li key={subscription.id} className={`gap-2 ${BORDER_RADIUS.xl} bg-surface-raised`}>
      <Link href={`/subscriptions/${subscription.id}`} className="block">
        <div className="border-b border-gray-700 pb-2">
          <div className="flex flex-row items-center justify-between gap-2 px-4 pt-3 w-full">
            <div className="flex flex-row items-center gap-2">
              <ConnectionIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
              <h3 className="text-base font-medium leading-6">
                {subscription.productName}
              </h3>
            </div>
            <ChevronRightIcon className={`w-2 h-3 ${COLORS.text.secondary}`} />
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="text-base font-medium leading-5">
            {subscription.vehicleDisplay}
          </div>
          <div className="text-xs font-light leading-5 mt-1">
            {getSubscriptionTypeAndPrice(subscription).displayText}
          </div>
          <div className={`text-xs font-light leading-5 ${COLORS.text.secondary}`}>
            {getSubscriptionRenewalInfo(subscription, subscription.nextScheduledPrice, subscription.nextScheduledDate).displayText}
          </div>
        </div>
      </Link>
    </li>
  );
}

export function StripeSubscriptions({ subscriptions }: { subscriptions: EnhancedSubscription[] }) {
  if (!subscriptions || subscriptions.length === 0) {
    return <p className="text-base font-medium leading-6">No devices found.</p>;
  }

  return (
    <ul className="space-y-4">
      {subscriptions.map(subscription => (
        <StripeSubscriptionItem key={subscription.id} subscription={subscription} />
      ))}
    </ul>
  );
}
