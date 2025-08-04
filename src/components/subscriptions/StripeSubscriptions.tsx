import type { StripeEnhancedSubscription } from '@/libs/StripeSubscriptionService';
import Link from 'next/link';
import { ChevronIcon, ConnectionIcon } from '@/components/Icons';
import { getSubscriptionTypeAndPrice } from '@/libs/StripeSubscriptionService';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';
import { getStripeSubscriptionRenewalInfo } from './utils/subscriptionDisplayHelpers';

function SubscriptionRenewalInfo({ subscription }: { subscription: StripeEnhancedSubscription }) {
  const renewalInfo = getStripeSubscriptionRenewalInfo(subscription, subscription.nextScheduledPrice, subscription.nextScheduledDate);

  return (
    <>
      <div>{renewalInfo.displayText}</div>
      {renewalInfo.secondaryText && (
        <div className="text-xs text-text-secondary">
          {renewalInfo.secondaryText}
        </div>
      )}
    </>
  );
}

function StripeSubscriptionItem({ subscription }: { subscription: StripeEnhancedSubscription }) {
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
            <ChevronIcon orientation="right" className={`w-2 h-3 ${COLORS.text.secondary}`} />
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="text-base font-medium leading-5">
            {subscription.vehicleDisplay}
          </div>
          <div className="text-xs font-light leading-5 mt-1">
            {getSubscriptionTypeAndPrice(subscription, subscription.nextScheduledPrice).displayText}
          </div>
          <div className={`text-xs font-light leading-5 ${COLORS.text.secondary}`}>
            <SubscriptionRenewalInfo subscription={subscription} />
          </div>
        </div>
      </Link>
    </li>
  );
}

export function StripeSubscriptions({ subscriptions }: { subscriptions: StripeEnhancedSubscription[] }) {
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
