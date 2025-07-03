import type Stripe from 'stripe';
import Link from 'next/link';
import { CarIcon, ChevronRightIcon, ConnectionIcon } from '@/components/Icons';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';
import { getSubscriptionRenewalInfo, getSubscriptionTypeAndPrice } from '@/utils/subscriptionHelpers';

type EnhancedSubscription = Stripe.Subscription & {
  productName: string;
  vehicleDisplay: string;
};

type SubscriptionsClientProps = {
  subscriptions: EnhancedSubscription[];
};

export function SubscriptionsClient({ subscriptions }: SubscriptionsClientProps) {
  let content;
  if (!subscriptions || subscriptions.length === 0) {
    content = <p>No subscriptions found.</p>;
  } else {
    content = (
      <ul className="space-y-4">
        {subscriptions.map(sub => (
          <li key={sub.id} className={`py-3 px-4 gap-2 ${BORDER_RADIUS.xl} bg-surface-raised hover:bg-dark-950 transition`}>
            <Link href={`/subscriptions/${sub.id}`} className="block">
              <div className="flex flex-row items-center justify-between gap-2 mb-2 border-b border-gray-700 pb-2">
                <div className="flex flex-row items-center gap-2">
                  <ConnectionIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
                  <h3 className="text-base font-medium leading-6">
                    {sub.productName}
                  </h3>
                </div>
                <ChevronRightIcon className={`w-2 h-3 ${COLORS.text.secondary}`} />
              </div>
              <div className="text-base font-medium leading-5 mb-2 mt-4">
                {sub.vehicleDisplay}
              </div>
              <div className="text-xs font-light leading-5 mt-2">
                {getSubscriptionTypeAndPrice(sub).displayText}
              </div>
              <div className={`text-xs font-light leading-5 ${COLORS.text.secondary}`}>
                {getSubscriptionRenewalInfo(sub).displayText}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-row items-center gap-2 border-b border-gray-700 pb-2">
        <CarIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
        <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Subscriptions</h1>
      </div>
      {content}
    </div>
  );
}

export default SubscriptionsClient;
