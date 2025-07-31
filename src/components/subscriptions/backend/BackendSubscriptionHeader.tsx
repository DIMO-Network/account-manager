import Link from 'next/link';
import { ChevronRightIcon, ConnectionIcon } from '@/components/Icons';
import { COLORS } from '@/utils/designSystem';
import { formatProductName, getDeviceHeaderName } from '../utils/subscriptionDisplayHelpers';

type BackendSubscriptionHeaderProps = {
  stripeId: string | null;
  productName: string | null;
  loading: boolean;
  device: any;
  children?: React.ReactNode;
};

export function BackendSubscriptionHeader({
  stripeId,
  productName,
  loading,
  device,
  children,
}: BackendSubscriptionHeaderProps) {
  const headerContent = (
    <div className="border-b border-gray-600 pb-2">
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
        {(stripeId || device?.tokenId) && <ChevronRightIcon className={`w-2 h-3 ${COLORS.text.secondary}`} />}
      </div>
    </div>
  );

  // For grandfathered devices (no stripeId), link to device tokenId
  if (!stripeId && device?.tokenId) {
    return (
      <Link href={`/subscriptions/device/${device.tokenId}`} className="block">
        {headerContent}
        {children}
      </Link>
    );
  }

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
