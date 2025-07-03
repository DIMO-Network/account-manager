import Link from 'next/link';
import { CarIcon, ChevronRightIcon, ConnectionIcon } from '@/components/Icons';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';

type SubscriptionsClientProps = {
  subscriptions: any[];
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
                {(() => {
                  const interval = sub.items?.data?.[0]?.price?.recurring?.interval;
                  const priceCents = sub.items?.data?.[0]?.price?.unit_amount;
                  let priceFormatted = '';
                  if (typeof priceCents === 'number') {
                    priceFormatted = ` ($${(priceCents / 100).toFixed(2)})`;
                  }

                  let type = 'N/A';
                  if (interval === 'month') {
                    type = 'Monthly';
                  } else if (interval === 'year') {
                    type = 'Annually';
                  }

                  return `${type}${priceFormatted}`;
                })()}
              </div>
              <div className={`text-xs font-light leading-5 ${COLORS.text.secondary}`}>
                {(() => {
                  const currentPeriodEnd = sub.items?.data?.[0]?.current_period_end;
                  const status = sub.status;

                  if (!currentPeriodEnd) {
                    return 'N/A';
                  }

                  const date = new Date(currentPeriodEnd * 1000).toLocaleDateString();

                  if (status === 'trialing') {
                    return `Free until ${date}`;
                  } else if (status === 'active') {
                    return `Renews on ${date}`;
                  } else if (status === 'canceled') {
                    return `Cancels on ${date}`;
                  } else {
                    return date;
                  }
                })()}
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
