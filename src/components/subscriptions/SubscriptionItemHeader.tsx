import Link from 'next/link';
import { ChevronRightIcon, ConnectionIcon } from '@/components/Icons';
import { COLORS } from '@/utils/designSystem';
import { formatProductName, getDeviceHeaderName } from './utils/subscriptionDisplayHelpers';

type SubscriptionItemHeaderProps = {
  stripeId: string | null;
  productName: string | null;
  loading: boolean;
  device: any;
  children?: React.ReactNode;
};

export function SubscriptionItemHeader({
  stripeId,
  productName,
  loading,
  device,
  children,
}: SubscriptionItemHeaderProps) {
  const headerContent = (
    <div className="border-b border-gray-700 pb-2">
      <div className="flex flex-row items-center justify-between gap-2 px-4 pt-3 w-full">
        <div className="flex flex-row items-center gap-2">
          <ConnectionIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
          <h3 className="text-base font-medium leading-6">
            {loading
              ? (
                  <div className="animate-pulse bg-surface-sunken h-6 w-32 rounded" />
                )
              : (
                  formatProductName(productName) || getDeviceHeaderName(device)
                )}
          </h3>
        </div>
        {stripeId && <ChevronRightIcon className={`w-2 h-3 ${COLORS.text.secondary}`} />}
      </div>
    </div>
  );

  if (stripeId) {
    return (
      <Link href={`/subscriptions/${stripeId}`} className="block">
        {headerContent}
        {children}
      </Link>
    );
  }

  return (
    <>
      {headerContent}
      {children}
    </>
  );
}
